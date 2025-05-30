<template>
    <DashboardPage title="Manage Agents" subtitle="View and manage your network agents" image="bi bi-wifi" class="agent-management-page">

        <!-- Agents Section -->
        <section class="agents-section py-5">
            <div class="container">
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text form-input-small">
                                <i class="bi bi-search text-light"></i>
                            </span>
                            <input type="text" class="form-control form-input-small"
                                placeholder="Search agents..." v-model="searchQuery">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select form-input" v-model="statusFilter">
                            <option value="">All Status</option>
                            <option v-for="type in ModelUtils.OnlineStatus.getAllTypes()" :value="type.name">
                                {{ type.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select form-input" v-model="typeFilter">
                            <option value="">All Types</option>
                            <option v-for="type in Agent.Utils.getAllAgentTypes()" :value="type.name">
                                {{ type.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary fw-bold w-100"
                            @click="agentEditModalHandler.showModal()">
                            <i class="bi bi-plus-circle me-2"></i>
                            Add New Agent
                        </button>
                    </div>
                </div>

                <!-- Agent Table -->
                <SimpleTable>
                    <thead>
                        <tr>
                            <th scope="col">Agent</th>
                            <th scope="col" class="text-center">Status</th>
                            <th scope="col" class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(agent, index) in filteredAgents" :key="agent.id">
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="agent-icon me-3">
                                        <i :class="agent.getAgentIcon()"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold text-white text-break">{{ agent.name }}</div>
                                        <div class="small text-light opacity-75 text-break">{{ agent.description }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-center">
                                <span :class="agent.getStatusBadgeClass()" class="badge px-3 py-2">
                                    <i :class="agent.getStatusIcon()" class="me-1"></i>
                                    {{ agent.status.charAt(0).toUpperCase() + agent.status.slice(1) }}
                                </span>
                            </td>
                            <td>
                                <div class="d-flex justify-content-end gap-2">
                                    <button class="btn btn-info btn-sm" @click="agent.refreshStatus()" title="Ping">
                                        <i class="bi bi-arrow-repeat"></i>
                                    </button>
                                    <button class="btn btn-primary btn-sm" @click="editAgent(agent)" title="Edit">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm" @click="deleteAgent(agent.id)"
                                        title="Delete">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </SimpleTable>

                <div v-if="filteredAgents.length === 0" class="text-center py-5 rounded-4 bg-dark bg-opacity-50">
                    <i class="bi bi-inbox text-light opacity-50" style="font-size: 4rem;"></i>
                    <h4 class="text-light opacity-75 mt-3">No agents found</h4>
                    <p class="text-light opacity-50">
                        {{ agents.length === 0 ? 'Add your first agent to get started' : 'No agents match your search criteria' }}
                    </p>
                </div>

            </div>
        </section>

        <!-- Add/Edit Agent Modal -->
        <FormModal :handler="agentEditModalHandler">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">Agent Name</label>
                    <input type="text" class="form-control form-input" v-model="agentForm.values.name" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Agent Type</label>
                    <select class="form-select form-input" v-model="agentForm.values.type" required>
                        <option value="" disabled>Select Agent Type</option>
                        <option v-for="type in Agent.Utils.getAllAgentTypes()" :value="type.name">
                            {{ type.label }}
                        </option>
                    </select>
                </div>
                <div class="col-12">
                    <label class="form-label">Description</label>
                    <textarea class="form-control form-input" rows="2" v-model="agentForm.values.description"></textarea>
                </div>
                <div class="col-12">
                    <label class="form-label">Connection Secret</label>
                    <input type="password" class="form-control form-input" v-model="agentForm.values.secret" required>
                </div>
            </div>
        </FormModal>
    </DashboardPage>
</template>

<script setup lang="ts">

import { ref, computed } from 'vue'
import { Agent } from '@/utils/models/agent';

import FormModal from '@/components/FormModal.vue';
import DashboardPage from '@/components/DashboardPage.vue';
import { FormModalHandler } from '@/utils/handlers/formModal';
import SimpleTable from '~/components/SimpleTable.vue';
import { ModelUtils } from '~/utils/models/utils';

definePageMeta({
	layout: 'dashboard',
	middleware: 'auth',
});


// Reactive data
const agents = reactive<Agent[]>([]);

const respGETonse = await $fetch('/api/agents', {
    method: '',
    headers: {
        'Content-Type': 'application/json',
    },
});



// const showAddAgentModal = ref(false);
const editingAgent = ref(null);
const searchQuery = ref('');
const statusFilter = ref('');
const typeFilter = ref('');


// Computed properties
const filteredAgents = computed(() => {
    let filtered = agents;

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(agent =>
            agent.name.toLowerCase().includes(query) ||
            agent.description.toLowerCase().includes(query)
        )
    }

    if (statusFilter.value) {
        filtered = filtered.filter(agent => agent.status === statusFilter.value)
    }

    if (typeFilter.value) {
        filtered = filtered.filter(agent => agent.type === typeFilter.value)
    }

    return filtered;
});


function editAgent(agent: Agent) {
    editingAgent.value = agent as any;

    agentEditModalHandler.settings.header.title = 'Edit Agent';
    agentEditModalHandler.settings.submitText = 'Update Agent';

    agentForm.set({ ...agent });
    agentEditModalHandler.showModal();
}

function deleteAgent(agentId: number) {
    if (confirm('Are you sure you want to delete this agent?')) {
        const index = agents.findIndex(d => d.id === agentId)
        if (index > -1) {
            agents.splice(index, 1)
        }
    }
}


const agentForm = new SimpleForm(
    {
        name: '',
        type: '' as Agent.Type,
        description: '',
        secret: ''
    },
    saveAgent
);

const agentEditModalHandler = new FormModalHandler({
    header: {
        title: 'Add New Agent',
        icon: 'bi bi-plus-circle'
    },
    submitText: 'Add Agent',

    onModalClose: () => {
        agentEditModalHandler.settings.header.title = 'Add New Agent';
        agentEditModalHandler.settings.submitText = 'Add Agent';
        editingAgent.value = null;
    }

}, agentForm);

function saveAgent() {
    if (editingAgent.value) {
        // Update existing agent
        const index = agents.findIndex(d => d.id === (editingAgent as any).value.id);
        if (index > -1) {
            agents[index] = Agent.fromData({ ...agents[index] as Agent, ...agentForm.values });
        }

    } else {
        // Add new agent
        const newAgent = Agent.fromData({
            id: Date.now(),
            ...agentForm.values,
            status: 'offline'
        });
        agents.push(newAgent);
    }
}

</script>

<style scoped>

@import url('/assets/forms.css');

.agent-icon {
    min-width: 40px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    font-size: 1.25rem;
}

</style>