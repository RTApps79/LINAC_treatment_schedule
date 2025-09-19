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

            // --- Populate Summary Tab Cards ---
            // Demographics Summary
            const summaryDemographicsContent = `
                <p><strong>Patient ID:</strong> ${patient.patientId}</p>
                <p><strong>DOB:</strong> ${patient.demographics.dob}</p>
                <p><strong>Referring MD:</strong> ${patient.demographics.radOnc || 'N/A'}</p>
            `;
            document.querySelector('#summary-demographics-card .card-content').innerHTML = summaryDemographicsContent;

            // Diagnosis Summary
            const summaryDiagnosisContent = `
                <p><strong>Primary:</strong> ${patient.diagnosis.primary}</p>
                <p><strong>Location:</strong> ${patient.diagnosis.location}</p>
                <p><strong>Stage:</strong> ${patient.diagnosis.overallStage || patient.diagnosis.pathologicStage || 'N/A'}</p>
            `;
            document.querySelector('#summary-diagnosis-card .card-content').innerHTML = summaryDiagnosisContent;

            // Treatment Plan Summary
            const summaryPlanContent = `
                <p><strong>Oncologist:</strong> ${patient.treatmentPlan.radOnc}</p>
                <p><strong>Site:</strong> ${patient.treatmentPlan.treatmentSite}</p>
                <p><strong>Rx Dose:</strong> ${patient.treatmentPlan.prescription.dosePerFraction_cGy} cGy x ${patient.treatmentPlan.prescription.numberOfFractions} fx</p>
                <p><strong>Total Dose:</strong> ${patient.treatmentPlan.prescription.totalDose_cGy} cGy</p>
                <p><strong>Fractions Del:</strong> ${patient.treatmentDelivery.totalFractionsDelivered}</p>
            `;
            document.querySelector('#summary-plan-card .card-content').innerHTML = summaryPlanContent;

            // Alerts Summary
            const summaryAlerts = patient.treatmentPlan.therapistAlerts || [];
            const summaryAlertsContent = summaryAlerts.length > 0
                ? `<ul>${summaryAlerts.map(alert => `<li>${alert}</li>`).join('')}</ul>`
                : '<p>No current alerts.</p>';
            document.querySelector('#summary-alerts-card .card-content').innerHTML = summaryAlertsContent;


            // --- Populate Full Demographics Tab ---
            const fullDemographicsContent = `
                <p><strong>Patient ID:</strong> ${patient.patientId}</p>
                <p><strong>Name:</strong> ${patient.demographics.name}</p>
                <p><strong>DOB:</strong> ${patient.demographics.dob}</p>
                <p><strong>Referring MD:</strong> ${patient.demographics.radOnc || 'N/A'}</p>
                <p><strong>Mobility:</strong> ${patient.demographics.mobility || 'N/A'}</p>
                <p><strong>Emergency Contact:</strong> ${patient.demographics.emergencyContact || 'N/A'}</p>
            `;
            document.querySelector('#demographics-full-card .card-content').innerHTML = fullDemographicsContent;


            // --- Populate Full Diagnosis Tab ---
            const fullDiagnosisContent = `
                <p><strong>Primary Diagnosis:</strong> ${patient.diagnosis.primary}</p>
                <p><strong>Location:</strong> ${patient.diagnosis.location}</p>
                <p><strong>Overall Stage:</strong> ${patient.diagnosis.overallStage || 'N/A'}</p>
                <p><strong>Pathologic Stage:</strong> ${patient.diagnosis.pathologicStage || 'N/A'}</p>
                <p><strong>Histology:</strong> ${patient.diagnosis.histology || 'N/A'}</p>
            `;
            document.querySelector('#diagnosis-full-card .card-content').innerHTML = fullDiagnosisContent;


            // --- Populate Full Treatment Plan Tab ---
            let treatmentFieldsContent = '';
            if (patient.treatmentPlan.treatmentFields && patient.treatmentPlan.treatmentFields.length > 0) {
                treatmentFieldsContent = `
                    <h3>Treatment Fields</h3>
                    ${patient.treatmentPlan.treatmentFields.map(field => `
                        <div class="field-details">
                            <h4>${field.fieldName} (${field.technique})</h4>
                            <p><strong>Energy:</strong> ${field.energy_MV} MV</p>
                            <p><strong>Monitor Units:</strong> ${field.monitorUnits}</p>
                            <p><strong>Gantry Angle:</strong> ${field.gantryAngle}</p>
                            <p><strong>Collimator Angle:</strong> ${field.collimatorAngle}</p>
                            <p><strong>Jaw Positions (cm):</strong> X1:${field.jawPositions_cm.X1}, X2:${field.jawPositions_cm.X2}, Y1:${field.jawPositions_cm.Y1}, Y2:${field.jawPositions_cm.Y2}</p>
                        </div>
                    `).join('')}
                `;
            } else {
                treatmentFieldsContent = '<p>No detailed field information available.</p>';
            }

            const fullPlanContent = `
                <p><strong>Radiation Oncologist:</strong> ${patient.treatmentPlan.radOnc}</p>
                <p><strong>Treatment Site:</strong> ${patient.treatmentPlan.treatmentSite}</p>
                <p><strong>Intent:</strong> ${patient.treatmentPlan.intent || 'N/A'}</p>
                <p><strong>Prescription:</strong> ${patient.treatmentPlan.prescription.dosePerFraction_cGy} cGy x ${patient.treatmentPlan.prescription.numberOfFractions} fx = ${patient.treatmentPlan.prescription.totalDose_cGy} cGy Total</p>
                <p><strong>Technique Summary:</strong> ${patient.treatmentPlan.techniqueSummary || 'N/A'}</p>
                ${treatmentFieldsContent}
            `;
            document.querySelector('#plan-full-card .card-content').innerHTML = fullPlanContent;


            // --- Populate Treatment Records Tab ---
            // Assuming full treatment records are in `radiationOncologyData.treatmentDelivery.fractions`
            const records = patient.radiationOncologyData?.treatmentDelivery?.fractions || [];
            let recordsContent = '';
            if (records.length > 0) {
                recordsContent = `
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
                    </div>
                `;
            } else {
                recordsContent = '<p>No detailed treatment records found in this file.</p>';
            }
            document.querySelector('#records-full-card .card-content').innerHTML = recordsContent;


            // --- Populate Full Alerts Tab ---
            const fullAlerts = patient.treatmentPlan.therapistAlerts || [];
            const fullAlertsContent = fullAlerts.length > 0
                ? `<ul>${fullAlerts.map(alert => `<li>${alert}</li>`).join('')}</ul>`
                : '<p>No specific therapist alerts.</p>';
            document.querySelector('#alerts-full-card .card-content').innerHTML = fullAlertsContent;


            // --- Tab Switching Logic ---
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabPanes = document.querySelectorAll('.tab-pane');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons and panes
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabPanes.forEach(pane => pane.classList.remove('active'));

                    // Add active class to the clicked button and its corresponding pane
                    button.classList.add('active');
                    const targetTabId = button.dataset.tab;
                    document.getElementById(targetTabId).classList.add('active');
                });
            });

        })
        .catch(error => {
            console.error('Error fetching patient details:', error);
            document.getElementById('patient-name-header').textContent = 'Error Loading Chart';
            document.querySelector('.tabs-container').innerHTML = `<p style="text-align: center; color: red;">Failed to load patient data. Please check the console for more details.</p>`;
        });
});
