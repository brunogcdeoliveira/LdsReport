import { app } from './firebase-config.js';
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

Chart.register(ChartDataLabels);

const auth = getAuth(app);
const db = getDatabase(app);

let currentFilter = 'Geral';
let currentChartType = 'frequency';
let mainChart = null;
let allUnitData = {};
let allFrequencyData = {};
const dashboardTitle = document.getElementById('dashboard-title');
const filterContainer = document.getElementById('filter-container');
const kpiContainer = document.getElementById('kpi-container');
const organizationsContainer = document.getElementById('organizations-container');
const chartCanvas = document.getElementById('main-chart');
const chartSelector = document.getElementById('chart-selector');
const chartTitle = document.getElementById('chart-title');
const logoutButton = document.getElementById('logout-button');

const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
};

const renderFrequencyChart = (frequencyDataArray) => {

    const sortedData = frequencyDataArray.sort((a, b) => parseDate(a.Data) - parseDate(b.Data));
    const dataValues = sortedData.map(d => d.Frequencia);
    const maxValue = Math.max(...dataValues);
    const suggestedMax = maxValue > 0 ? Math.ceil((maxValue * 1.15) / 10) * 10 : 100;

    return {
        type: 'bar',
        data: {
            labels: sortedData.map(d => d.Data), // Eixo X
            datasets: [{
                label: 'Frequência na Reunião',
                data: sortedData.map(d => d.Frequencia), // Eixo Y
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(37, 99, 235, 1)',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Nº de Membros' },
                    suggestedMax: suggestedMax
                },
                x: {
                    title: { display: true, text: 'Data da Reunião' }
                }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#555',
                    font: {
                        weight: 'bold',
                    }
                }
            }
        }
    };
};

const renderOrganizationsChart = (data) => {
    const labels = ['Quórum de Élderes', 'Soc. de Socorro', 'Rapazes', 'Moças', 'Primária'];
    const chartData = [
        parseInt(data.ContagemQE || 0),
        parseInt(data.ContagemSoc || 0),
        parseInt(data.ContagemOr || 0),
        parseInt(data.ContagemOm || 0),
        parseInt(data.ContagemPri || 0),
    ];

    return {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Membros',
                data: chartData,
                backgroundColor: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'],
                hoverOffset: 4,
            }]
        },
        options: {
            plugins: {
                legend: { position: 'top' },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, context) => {
                        const datapoints = context.chart.data.datasets[0].data;
                        const total = datapoints.reduce((total, datapoint) => total + datapoint, 0);
                        const percentage = (value / total * 100).toFixed(1) + "%";
                        return percentage;
                    }
                }
            }
        }
    };
};

const renderRecommendsChart = (data) => {
    return {
        type: 'pie',
        data: {
            labels: ['Ativas', 'Vencidas'],
            datasets: [{
                label: 'Recomendações',
                data: [parseInt(data.RecomendacoesAtivas || 0), parseInt(data.RecomendacoesVencidas || 0)],
                backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
                hoverOffset: 4,
            }]
        },
        options: {
            plugins: {
                legend: { position: 'top' },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, context) => {
                        const datapoints = context.chart.data.datasets[0].data;
                        const total = datapoints.reduce((total, datapoint) => total + datapoint, 0);
                        const percentage = (value / total * 100).toFixed(1) + "%";
                        return percentage;
                    }
                }
            }
        }
    };
};

const chartConfig = {
    frequency: { title: 'Frequência Sacramental', renderFunc: renderFrequencyChart, dataSource: 'frequencies' },
    organizations: { title: 'Distribuição por Organização', renderFunc: renderOrganizationsChart, dataSource: 'units' },
    recommends: { title: 'Status das Recomendações', renderFunc: renderRecommendsChart, dataSource: 'units' },
};

const renderActiveChart = (data) => {
    const config = chartConfig[currentChartType];
    if (!config || !data) return;
    chartTitle.textContent = config.title;
    const chartDefinition = config.renderFunc(data);
    if (mainChart) mainChart.destroy();
    mainChart = new Chart(chartCanvas.getContext('2d'), {
        type: chartDefinition.type, data: chartDefinition.data,
        options: {
            responsive: true, maintainAspectRatio: false,
            ...chartDefinition.options,
        }
    });
};

const updateKPIs = (unitData, frequencyDataArray) => {
    const currentYear = new Date().getFullYear();
    const frequenciesThisYear = frequencyDataArray.filter(f => parseDate(f.Data).getFullYear() === currentYear);
    const totalAttendance = frequenciesThisYear.reduce((sum, f) => sum + parseInt(f.Frequencia), 0);
    const averageFrequency = frequenciesThisYear.length > 0 ? (totalAttendance / frequenciesThisYear.length) : 0;

    kpiContainer.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-gray-500 font-semibold">Total de Membros</h3><p class="text-3xl font-bold text-gray-800">${unitData.ContagemMembros || 0}</p></div>
        <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-gray-500 font-semibold">Frequência Média (Ano)</h3><p class="text-3xl font-bold text-gray-800">${averageFrequency.toFixed(0)}</p></div>
        <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-gray-500 font-semibold">Recomendações Ativas</h3><p class="text-3xl font-bold text-gray-800">${unitData.RecomendacoesAtivas || 0}</p></div>
        <div class="bg-white p-6 rounded-xl shadow-md"><h3 class="text-gray-500 font-semibold">Bênçãos Patriarcais</h3><p class="text-3xl font-bold text-gray-800">${unitData.BencaosPatriarcais || 0}</p></div>
    `;
};

const updateOrganizationsCount = (data) => {
    organizationsContainer.innerHTML = `
        <div class="flex justify-between items-center border-b pb-2"><span class="text-sm">Quórum de Élderes</span><span class="font-bold text-lg">${data.ContagemQE || 0}</span></div>
        <div class="flex justify-between items-center border-b pb-2"><span class="text-sm">Sociedade de Socorro</span><span class="font-bold text-lg">${data.ContagemSoc || 0}</span></div>
        <div class="flex justify-between items-center border-b pb-2"><span class="text-sm">Rapazes</span><span class="font-bold text-lg">${data.ContagemOr || 0}</span></div>
        <div class="flex justify-between items-center border-b pb-2"><span class="text-sm">Moças</span><span class="font-bold text-lg">${data.ContagemOm || 0}</span></div>
        <div class="flex justify-between items-center pt-2"><span class="text-sm">Primária</span><span class="font-bold text-lg">${data.ContagemPri || 0}</span></div>
    `;
};

const updateDashboard = () => {
    let filteredUnitData;
    if (currentFilter === 'Geral') {
        filteredUnitData = { ContagemMembros: 0, BencaosPatriarcais: 0, RecomendacoesAtivas: 0, RecomendacoesVencidas: 0, ContagemQE: 0, ContagemSoc: 0, ContagemOr: 0, ContagemOm: 0, ContagemPri: 0 };
        for (const alaData of Object.values(allUnitData)) {
            for (const key in filteredUnitData) {
                filteredUnitData[key] += parseInt(alaData[key] || 0);
            }
        }
    } else {
        filteredUnitData = allUnitData[currentFilter];
    }

    let filteredFrequencies;
    const allFrequenciesArray = Object.values(allFrequencyData);

    if (currentFilter === 'Geral') {
        const summedByDate = {};
        allFrequenciesArray.forEach(freq => {
            const count = parseInt(freq.Frequencia);
            if (summedByDate[freq.Data]) {
                summedByDate[freq.Data] += count;
            } else {
                summedByDate[freq.Data] = count;
            }
        });

        filteredFrequencies = Object.keys(summedByDate).map(date => ({
            Data: date,
            Frequencia: summedByDate[date]
        }));
    } else {
        filteredFrequencies = allFrequenciesArray.filter(freq => freq.Unidade === currentFilter);
    }

    if (!filteredUnitData) return;

    dashboardTitle.textContent = currentFilter === 'Geral' ? 'Visão Geral - Estaca' : currentFilter;

    updateKPIs(filteredUnitData, filteredFrequencies);
    updateOrganizationsCount(filteredUnitData);

    const activeChartConfig = chartConfig[currentChartType];
    const chartData = activeChartConfig.dataSource === 'frequencies' ? filteredFrequencies : filteredUnitData;
    renderActiveChart(chartData);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('filter-active', btn.dataset.filter === currentFilter);
    });
};

async function initializeAppWithData() {
    try {
        const snapshot = await get(ref(db, '/'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            allUnitData = data.unidades || {};
            allFrequencyData = data.frequencias || {};

            filterContainer.innerHTML = '<button data-filter="Geral" class="filter-btn w-full text-left py-2 px-4 rounded-md">Geral (Estaca)</button>';
            Object.keys(allUnitData).forEach(alaName => {
                const button = document.createElement('button');
                button.dataset.filter = alaName;
                button.className = 'filter-btn w-full text-left py-2 px-4 rounded-md transition-colors duration-200 hover:bg-gray-700';
                button.textContent = alaName;
                filterContainer.appendChild(button);
            });
            // A primeira renderização completa do dashboard
            updateDashboard();
        } else {
            dashboardTitle.textContent = "Nenhum dado encontrado no banco.";
        }
    } catch (error) {
        console.error("Erro ao buscar dados do Firebase:", error);
        dashboardTitle.textContent = "Erro ao carregar dados.";
    }
}

filterContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        currentFilter = e.target.dataset.filter;
        updateDashboard();
    }
});

chartSelector.addEventListener('change', (e) => {
    currentChartType = e.target.value;
    updateDashboard();
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Não foi possível sair. Tente novamente.");
    }
});

document.addEventListener('DOMContentLoaded', initializeAppWithData);