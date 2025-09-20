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
            initializeImagingTab(patient);
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
    const diagnosis = patient.diagnosis || {};
    const treatmentPlan = patient.treatmentPlan || {};
    const demographics = patient.demographics || {};
    summaryPane.innerHTML = `
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
}

function populateDeliveryTab(patient) {
    const deliveryPane = document.getElementById('delivery');
    const plan = patient.treatmentPlan || {};
    const prescription = plan.prescription || {};
    const deliveryData = patient.radiationOncologyData || {};
    const treatmentDelivery = deliveryData.treatmentDelivery || {};
    const fractions = treatmentDelivery.fractions || [];

    const totalFractions = prescription.numberOfFractions || 'N/A';
    const deliveredFractions = fractions.length;
    
    // Step 1: Create the HTML content
    deliveryPane.innerHTML = `
        <div class="delivery-container">
            <div class="delivery-header">
                <h2>Record Treatment Delivery</h2>
                <div id="fraction-counter">Fraction ${deliveredFractions + 1} of ${totalFractions}</div>
            </div>
            <div class="form-group">
                <label for="treatment-date">Treatment Date</label>
                <input type="date" id="treatment-date" name="treatment-date">
            </div>
            <div class="form-group">
                <label for="therapist-notes">Therapist Notes / Side Effects</label>
                <textarea id="therapist-notes" rows="4" placeholder="Enter notes for today's session..."></textarea>
            </div>
            <button id="record-treatment-btn" class="action-button">Record Treatment</button>
            <div id="delivery-confirmation" class="confirmation-message"></div>
        </div>
    `;

    // Step 2: Now that the HTML exists, find the elements and add logic
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
    const billingPane = document.getElementById('billing');
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

    // Step 1: Create the HTML content
    billingPane.innerHTML = `
        <div class="billing-container">
            <h2>CPT Code Capture for Today's Session</h2>
            <div id="cpt-table-container">${tableHTML}</div>
            <button id="capture-codes-btn" class="action-button">Capture Selected Codes</button>
            <div id="billing-confirmation" class="confirmation-message"></div>
        </div>
    `;

    // Step 2: Now that the HTML exists, find the button and add logic
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
    // ... (This function remains the same as the previous version)
}

function populateRecordsTab(patient) {
    // ... (This function remains the same as the previous version)
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

function initializeImagingTab(patient) {
    const drrImage = document.getElementById('drr-image');
    const overlay = document.getElementById('kv-image-overlay');
    const opacitySlider = document.getElementById('opacity-slider');
    const controlBtns = document.querySelectorAll('.control-btn');
    const resetBtn = document.getElementById('reset-shifts');
    const applyBtn = document.getElementById('apply-shifts');
    const shiftConfirmation = document.getElementById('shift-confirmation');

    // --- NEW DYNAMIC IMAGE LOADING ---
    if (patient.imagingData && drrImage && overlay) {
        drrImage.src = `images/${patient.imagingData.drrImage}`;
        overlay.src = `images/${patient.imagingData.kvImage}`;
    } else {
        console.error("Image elements or imagingData not found for this patient.");
    }

// Ensure the populate functions from the previous correct version are here
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
