import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3000';

async function testMetricsForMonth(month) {
  try {
    // Get the metrics for the specified month
    const response = await fetch(`${baseUrl}/api/trpc/branches.metrics.consolidated?input={"organizationId":1,"month":"${month}"}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log(`Month ${month}: HTTP ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Month ${month}:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error testing month ${month}:`, error.message);
  }
}

// Test all months
const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
for (const month of months) {
  await testMetricsForMonth(month);
  console.log('---');
}
