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

            // --- Populate Summary Tab ---
            document.querySelector('#summary-demographics-card .card-content').innerHTML = `
                <p><strong>Patient ID:</strong> ${patient.patientId}</p>
                <p><strong>DOB:</strong> ${patient.demographics.dob}</p>
            `;
            document.querySelector('#summary-diagnosis-card .card-content').innerHTML = `
                <p><strong>Primary:</strong> ${patient.diagnosis.primary}</p>
                <p><strong>Site:</strong> ${patient.treatmentPlan.treatmentSite}</p>
            `;
            document.querySelector('#summary-plan-card .card-content').innerHTML = `
                <p><strong>Oncologist:</strong> ${patient.treatmentPlan.radOnc}</p>
                <p><strong>Rx:</strong> ${patient.treatmentPlan.prescription.dosePerFraction_cGy} cGy x ${patient.treatmentPlan.prescription.numberOfFractions} fx</p>
                <p><strong>Total Dose:</strong> ${patient.treatmentPlan.prescription.totalDose_cGy} cGy</p>
            `;
            const summaryAlerts = patient.treatmentPlan.therapistAlerts || [];
            document.querySelector('#summary-alerts-card .card-content').innerHTML = summaryAlerts.length > 0
                ? `<ul>${summaryAlerts.map(alert => `<li>${alert}</li>`).join('')}</ul>`
                : '<p>No current alerts.</p>';

            // --- Populate Full Demographics Tab ---
            document.querySelector('#demographics-full-card .card-content').innerHTML = `
                <p><strong>Patient ID:</strong> ${patient.patientId}</p>
                <p><strong>Name:</strong> ${patient.demographics.name}</p>
                <p><strong>DOB:</strong> ${patient.demographics.dob}</p>
            `;

            // --- Populate Full Treatment Plan Tab ---
            let treatmentFieldsContent = '';
            if (patient.treatmentPlan.treatmentFields && patient.treatmentPlan.treatmentFields.length > 0) {
                treatmentFieldsContent = `
                    <h3>Treatment Fields</h3>
                    ${patient.treatmentPlan.treatmentFields.map(field => `
                        <div class="field-details">
                            <h4>${field.fieldName} (${field.technique})</h4>
                            <p><strong>Energy:</strong> ${field.energy_MV} MV | <strong>MU:</strong> ${field.monitorUnits}</p>
                            <p><strong>Gantry:</strong> ${field.gantryAngle}° | <strong>Collimator:</strong> ${field.collimatorAngle}°</p>
                            <p><strong>Jaws (cm):</strong> X1:${field.jawPositions_cm.X1}, X2:${field.jawPositions_cm.X2}, Y1:${field.jawPositions_cm.Y1}, Y2:${field.jawPositions_cm.Y2}</p>
                        </div>
                    `).join('')}
                `;
            }
            document.querySelector('#plan-full-card .card-content').innerHTML = `
                <p><strong>Radiation Oncologist:</strong> ${patient.treatmentPlan.radOnc}</p>
                <p><strong>Prescription:</strong> ${patient.treatmentPlan.prescription.dosePerFraction_cGy} cGy x ${patient.treatmentPlan.prescription.numberOfFractions} fx = ${patient.treatmentPlan.prescription.totalDose_cGy} cGy Total</p>
                ${treatmentFieldsContent}
            `;

            // --- Populate Treatment Records Tab ---
             const records = patient.radiationOncologyData?.treatmentDelivery?.fractions || [];
             document.querySelector('#records-full-card .card-content').innerHTML = records.length > 0 ? `
                <div class="records-table">
                    <div class="records-header">
                        <div>#</div>
                        <div>Date</div>
                        <div>Side Effects</div>
                    </div>
                    ${records.map(fx => `
                        <div class="records-row">
                            <div>${fx.fractionNumber}</div>
                            <div>${fx.date}</div>
                            <div>${fx.siteSpecificSideEffects || fx.generalSideEffects || 'None noted'}</div>
                        </div>
                    `).join('')}
                </div>` : '<p>No detailed treatment records found in this file.</p>';

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
