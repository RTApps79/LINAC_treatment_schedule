// In patient.js

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
            
            // --- Populate Demographics Card ---
            const demographicsContent = `
                <p><strong>Patient ID:</strong> ${patient.patientId}</p>
                <p><strong>DOB:</strong> ${patient.demographics.dob}</p>
                <p><strong>Referring MD:</strong> ${patient.demographics.referringPhysician}</p>
                <p><strong>Mobility:</strong> ${patient.demographics.mobility || 'N/A'}</p>
            `;
            document.querySelector('#demographics-card .card-content').innerHTML = demographicsContent;

            // --- Populate Diagnosis Card ---
            const diagnosisContent = `
                <p><strong>Primary:</strong> ${patient.diagnosis.primary}</p>
                <p><strong>Location:</strong> ${patient.diagnosis.location}</p>
                <p><strong>Stage:</strong> ${patient.diagnosis.overallStage || patient.diagnosis.pathologicStage || 'N/A'}</p>
            `;
            document.querySelector('#diagnosis-card .card-content').innerHTML = diagnosisContent;

            // --- Populate Alerts Card ---
            const alerts = patient.treatmentPlan.therapistAlerts || [];
            const alertsContent = alerts.length > 0
                ? `<ul>${alerts.map(alert => `<li>${alert}</li>`).join('')}</ul>`
                : '<p>No specific alerts.</p>';
            document.querySelector('#alerts-card .card-content').innerHTML = alertsContent;

            // --- Populate Treatment Plan Card ---
            const planContent = `
                <p><strong>Oncologist:</strong> ${patient.treatmentPlan.radOnc}</p>
                <p><strong>Site:</strong> ${patient.treatmentPlan.treatmentSite}</p>
                <p><strong>Intent:</strong> ${patient.treatmentPlan.intent}</p>
                <p><strong>Prescription:</strong> ${patient.treatmentPlan.rtRxDetails}</p>
                <p><strong>Technique:</strong> ${patient.treatmentPlan.techniqueSummary}</p>
            `;
            document.querySelector('#plan-card .card-content').innerHTML = planContent;

            // --- Populate Treatment Records Card (CORRECTED PATH) ---
            // This path now correctly points to your data structure
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
                recordsContent = '<p>No treatment records found in this file.</p>';
            }
            document.querySelector('#records-card .card-content').innerHTML = recordsContent;

        })
        .catch(error => {
            console.error('Error fetching patient details:', error);
            document.getElementById('patient-name-header').textContent = 'Error Loading Chart';
        });
});
