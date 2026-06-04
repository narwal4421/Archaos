#!/usr/bin/env node

const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
  ARCHAOS Chaos Simulation Headless CLI
  
  Usage:
    archaos-sim <config-file-path> [--url <api-url>]
    
  Example:
    archaos-sim config.json --url http://localhost:3000
  `);
  process.exit(0);
}

const configPath = args[0];
let urlIndex = args.indexOf('--url');
let apiUrl = 'http://localhost:3000'; // Default port is usually 3000 or 3001

if (urlIndex !== -1 && args[urlIndex + 1]) {
  apiUrl = args[urlIndex + 1];
}

if (!fs.existsSync(configPath)) {
  console.error(`Error: Configuration file not found at ${configPath}`);
  process.exit(1);
}

let configData;
try {
  configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error(`Error: Failed to parse configuration JSON: ${e.message}`);
  process.exit(1);
}

console.log(`\n🌀 Sending topology simulation to Archaos backend at ${apiUrl}...`);

const payload = JSON.stringify({
  nodes: configData.nodes || [],
  edges: configData.edges || [],
  chaosScript: configData.chaosScript || [],
  durationSecs: configData.durationSecs || 30,
});

const url = new URL(apiUrl + '/run-headless');
const req = http.request(
  {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        console.error(`Error: Server returned status code ${res.statusCode}`);
        console.error(data);
        process.exit(1);
      }

      try {
        const report = JSON.parse(data);
        displayReport(report);
      } catch (e) {
        console.error(`Error parsing response: ${e.message}`);
        process.exit(1);
      }
    });
  }
);

req.on('error', (e) => {
  console.error(`Error connecting to Archaos server: ${e.message}`);
  process.exit(1);
});

req.write(payload);
req.end();

function displayReport(report) {
  console.log('\n=============================================');
  console.log('       ARCHAOS SIMULATION REPORT             ');
  console.log('=============================================');
  console.log(`Duration:        ${report.durationSecs} seconds`);
  console.log(`Avg Error Rate:  ${report.avgErrorRatePercent}%`);
  console.log(`Peak Error Rate: ${report.peakErrorRatePercent}%`);
  console.log(`Nodes Killed:    ${report.nodesKilled}`);
  console.log('---------------------------------------------');
  
  if (report.slaCompliant) {
    console.log('✅ STATUS: SLA COMPLIANT (Avg error rate < 5.0%)');
    process.exit(0);
  } else {
    console.log('❌ STATUS: SLA BREACHED (Avg error rate >= 5.0%)');
    process.exit(1);
  }
}
