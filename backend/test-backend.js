import { runRuleBasedEligibility } from './services/gemini.js';
import { db } from './services/db.js';

console.log('--- STARTING BACKEND INTEGRATION TESTS ---');

// Test 1: JSON File Database Read check
try {
  const schemes = db.getSchemes();
  console.log(`✓ DB Read Test Passed. Total Schemes Loaded: ${schemes.length}`);
  if (schemes.length === 0) {
    throw new Error('Database is empty. Seeding might have failed.');
  }
} catch (e) {
  console.error('✗ DB Read Test Failed:', e);
  process.exit(1);
}

// Test 2: Rules Eligibility Engine check
try {
  const schemes = db.getSchemes();
  const pmKisan = schemes.find(s => s.id === 'pm-kisan');
  
  if (!pmKisan) {
    throw new Error('PM-KISAN scheme not found in database.');
  }

  // Farmer profile - should match PM-KISAN
  const farmerProfile = {
    age: 35,
    gender: 'Male',
    occupation: 'Farmer',
    income: 80000,
    state: 'Andhra Pradesh',
    isFarmer: true
  };

  const evalFarmer = runRuleBasedEligibility(pmKisan, farmerProfile, 'English');
  console.log('Farmer eligibility check:', evalFarmer.eligible ? 'ELIGIBLE (Passed)' : 'INELIGIBLE (Failed)');
  if (!evalFarmer.eligible) {
    throw new Error('Farmer eligibility rules miscalculated PM-KISAN matching.');
  }

  // Student profile - should fail PM-KISAN (since it is farmer only)
  const studentProfile = {
    age: 20,
    gender: 'Female',
    occupation: 'Student',
    income: 20000,
    state: 'Delhi',
    isFarmer: false
  };

  const evalStudent = runRuleBasedEligibility(pmKisan, studentProfile, 'English');
  console.log('Student eligibility check:', evalStudent.eligible ? 'ELIGIBLE (Failed)' : 'INELIGIBLE (Passed)');
  if (evalStudent.eligible) {
    throw new Error('Student incorrectly marked as eligible for farmer-only scheme.');
  }

  console.log('✓ Eligibility Rules Engine Tests Passed.');
} catch (e) {
  console.error('✗ Eligibility Rules Engine Test Failed:', e);
  process.exit(1);
}

console.log('--- ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULY ---');
process.exit(0);
