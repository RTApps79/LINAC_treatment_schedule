document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const fileName = params.get('file');

    if (!fileName) {
        document.getElementById('patient-name-header').textContent = 'Error: No Patient File';
        return;
    }

    fetch(`data/${fileName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(patient => {
            document.getElementById('patient-name-header').textContent = `Chart: ${patient.demographics.name}`;

            // --- Populate All Tab Panes ---
            populateSummaryTab(patient);
            populateDeliveryTab(patient);
            populateBillingTab(patient);
            populatePlanTab(patient);
            populateRecordsTab(patient);
            populateDemographicsTab(patient);

            // --- Tab Switching Logic ---
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabPanes.forEach(pane => pane.classList.remove('active'));
                    button.classList.add('active');
                    document.getElementById(button.dataset.tab).classList.add('active');
                });
            });
        })
        .catch(error => {
            console.error('Error fetching patient details:', error);
            document.getElementById('patient-name-header').textContent = 'Error Loading Chart';
        });
});

function populateSummaryTab(patient) {
    const summaryPane = document.getElementById('summary');
    
    // Safety check for diagnosis object
    const diagnosis = patient.diagnosis || {};
    const treatmentPlan = patient.treatmentPlan || {};
    const demographics = patient.demographics || {};

    const summaryHTML = `
        <div class="patient-grid-container">
            <div class="grid-column">
                <div class="detail-card">
                    <h2>Plan Overview</h2>
                    <div class="card-content">
                        <p><strong>Oncologist:</strong> ${treatmentPlan.radOnc || 'N/A'}</p>
                        <p><strong>Site:</strong> ${treatmentPlan.treatmentSite || 'N/A'}</p>
                        <p><strong>Rx:</strong> ${treatmentPlan.rtRxDetails || 'N/A'}</p>
                    </div>
                </div>
                <div class="detail-card">
                    <h2>Therapist Alerts</h2>
                    <div class="card-content">
                        <ul>${(treatmentPlan.therapistAlerts || ['None']).map(alert => `<li>${alert}</li>`).join('')}</ul>
                    </div>
                </div>
            </div>
            <div class="grid-column">
                 <div class="detail-card">
                    <h2>Patient Info</h2>
                    <div class="card-content">
                        <p><strong>Patient ID:</strong> ${patient.patientId || 'N/A'}</p>
                        <p><strong>DOB:</strong> ${demographics.dob || 'N/A'}</p>
                    </div>
                </div>
                <div class="detail-card">
                    <h2>Diagnosis</h2>
                    <div class="card-content">
                        <p><strong>Primary:</strong> ${diagnosis.primary || 'N/A'}</p>
                        <p><strong>Stage:</strong> ${diagnosis.overallStage || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    summaryPane.innerHTML = summaryHTML;
}

function populateDeliveryTab(patient) {
    const plan = patient.treatmentPlan || {};
    const prescription = plan.prescription || {};
    const deliveryData = patient.radiationOncologyData || {};
    const treatmentDelivery = deliveryData.treatmentDelivery || {};
    const fractions = treatmentDelivery.fractions || [];

    const totalFractions = prescription.numberOfFractions || 'N/A';
    const deliveredFractions = fractions.length;
    
    document.getElementById('fraction-counter').textContent = `Fraction ${deliveredFractions + 1} of ${totalFractions}`;
    document.getElementById('treatment-date').valueAsDate = new Date();

    const recordBtn = document.getElementById('record-treatment-btn');
    recordBtn.onclick = () => {
        const confirmationMsg = document.getElementById('delivery-confirmation');
        confirmationMsg.textContent = `Fraction ${deliveredFractions + 1} recorded successfully!`;
        confirmationMsg.style.display = 'block';
        recordBtn.disabled = true;
        recordBtn.style.backgroundColor = '#6c757d';
    };
}

function populateBillingTab(patient) {
    const container = document.getElementById('cpt-table-container');
    const charges = patient.cptCharges || [];
    const dailyCodes = charges.filter(c => c.frequency && c.frequency.toLowerCase().includes('daily'));

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Capture</th>
                    <th>CPT Code</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
    `;
    if (dailyCodes.length > 0) {
        dailyCodes.forEach(code => {
            tableHTML += `
                <tr>
                    <td><input type="checkbox" checked></td>
                    <td>${code.code}</td>
                    <td>${code.description}</td>
                </tr>
            `;
        });
    } else {
        tableHTML += `<tr><td colspan="3">No daily CPT codes found for this patient.</td></tr>`;
    }
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;

    const captureBtn = document.getElementById('capture-codes-btn');
    captureBtn.onclick = () => {
        const confirmationMsg = document.getElementById('billing-confirmation');
        confirmationMsg.textContent = 'CPT codes captured for today\'s session!';
        confirmationMsg.style.display = 'block';
        captureBtn.disabled = true;
        captureBtn.style.backgroundColor = '#6c757d';
    };
}

function populatePlanTab(patient) {
    const planPane = document.getElementById('plan');
    const treatmentPlan = patient.treatmentPlan || {};
    const fields = treatmentPlan.treatmentFields || [];

    let fieldsHTML = fields.map(field => `
        <div class="field-details">
            <h4>${field.fieldName || 'N/A'} (${field.technique || 'N/A'})</h4>
            <p><strong>Energy:</strong> ${field.energy_MV} MV | <strong>MU:</strong> ${field.monitorUnits}</p>
            <p><strong>Gantry:</strong> ${field.gantryAngle}° | <strong>Collimator:</strong> ${field.collimatorAngle}°</p>
            <p><strong>Jaws (cm):</strong> X1:${field.jawPositions_cm.X1}, X2:${field.jawPositions_cm.X2}, Y1:${field.jawPositions_cm.Y1}, Y2:${field.jawPositions_cm.Y2}</p>
        </div>
    `).join('');

    planPane.innerHTML = `
        <div class="detail-card full-width">
            <h2>Detailed Treatment Plan</h2>
            <div class="card-content">
                <p><strong>Radiation Oncologist:</strong> ${treatmentPlan.radOnc || 'N/A'}</p>
                <p><strong>Prescription:</strong> ${treatmentPlan.rtRxDetails || 'N/A'}</p>
                ${fieldsHTML}
            </div>
        </div>
    `;
}

function populateRecordsTab(patient) {
    const recordsPane = document.getElementById('records');
    const deliveryData = patient.radiationOncologyData || {};
    const treatmentDelivery = deliveryData.treatmentDelivery || {};
    const records = treatmentDelivery.fractions || [];

    let recordsHTML = records.length > 0 ? `
        <div class="records-table">
            <div class="records-header">
                <div>#</div>
                <div>Date</div>
                <div>Side Effects / Notes</div>
            </div>
            ${records.map(fx => `
                <div class="records-row">
                    <div>${fx.fractionNumber}</div>
                    <div>${fx.date}</div>
                    <div>${fx.sideEffects || fx.notes || 'None noted'}</div>
                </div>
            `).join('')}
        </div>` : '<p>No treatment records found.</p>';
    
    recordsPane.innerHTML = `
        <div class="detail-card full-width">
            <h2>Treatment Records & History</h2>
            <div class="card-content">${recordsHTML}</div>
        </div>
    `;
}

function populateDemographicsTab(patient) {
    const demoPane = document.getElementById('demographics');
    const demographics = patient.demographics || {};
    demoPane.innerHTML = `
        <div class="detail-card full-width">
            <h2>Full Demographics Details</h2>
            <div class="card-content">
                <p><strong>Patient ID:</strong> ${patient.patientId || 'N/A'}</p>
                <p><strong>Name:</strong> ${demographics.name || 'N/A'}</p>
                <p><strong>DOB:</strong> ${demographics.dob || 'N/A'}</p>
                <p><strong>Address:</strong> ${demographics.address || 'N/A'}</p>
                <p><strong>Phone:</strong> ${demographics.phone || 'N/A'}</p>
                <p><strong>Referring MD:</strong> ${demographics.referringPhysician || 'N/A'}</p>
            </div>
        </div>
    `;
}
