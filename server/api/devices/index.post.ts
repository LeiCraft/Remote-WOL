import { DBStorage } from '~/server/db';
import { UserAuthInfo } from '~/server/utils/auth/handler';

type CreatePayload = DBStorage.Device.ModelWithoutID;

export default defineEventHandler(async (event) => {

    const userinfo = event.context.userinfo as UserAuthInfo;
    if (!userinfo) return;

    const payload = await readBody(event) as CreatePayload | undefined;
    if (
        !payload ||
        typeof payload.name !== "string" ||
        typeof payload.macAddress !== "string" ||
        typeof payload.port !== "number" || payload.port < 0 || payload.port > 65535 ||
        typeof payload.agentID !== "number"
    ) {
        setResponseStatus(event, 400);
        return { status: "ERROR", message: "Invalid payload", data: null  };
    }

    payload.ownerID = userinfo.userID;

    const agentIDExists = await DBStorage.Agents.getByID(payload.agentID);
    if (!agentIDExists) {
        setResponseStatus(event, 400);
        return { status: "ERROR", message: "No matching agent found for the given AgentID", data: null };
    }

    const result = await DBStorage.Devices.insert(payload);
    if (!result) {
        setResponseStatus(event, 500);
        return { status: "ERROR", message: "Failed to create Device", data: null };
    }

    setResponseStatus(event, 201);
    return { status: "OK", message: "Device created successfully", data: result  };
});