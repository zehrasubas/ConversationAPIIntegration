#!/usr/bin/env node

/**
 * Secure Configuration Validator
 * Validates Facebook configuration without exposing sensitive data
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...values] = line.split('=');
        const value = values.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Initialize environment
loadEnvFile();

function validateConfig() {
  console.log('🔒 Secure Configuration Validator\n');
  console.log('📋 Checking configuration (without exposing values):\n');

  let isValid = true;
  let issues = [];
  let warnings = [];

  // Required variables with validation
  const requiredVars = {
    'APP_DOMAIN': {
      required: true,
      validator: (value) => value && !value.includes('your-domain'),
      message: 'Must be your actual Vercel domain (not placeholder)'
    },
    'FACEBOOK_LOGIN_APP_ID': {
      required: true,
      validator: (value) => value && !value.includes('your_') && value.length > 10,
      message: 'Must be your actual Facebook Login App ID (not placeholder)'
    },
    'FACEBOOK_APP_ID': {
      required: true,
      validator: (value) => value && !value.includes('your_') && value.length > 10,
      message: 'Must be your actual Facebook Messenger App ID (not placeholder)'
    },
    'FACEBOOK_APP_SECRET': {
      required: true,
      validator: (value) => value && !value.includes('your_') && value.length > 20,
      message: 'Must be your actual Facebook App Secret (not placeholder)'
    },
    'PAGE_ID': {
      required: true,
      validator: (value) => value && !value.includes('your_') && value.length > 10,
      message: 'Must be your actual Facebook Page ID (not placeholder)'
    },
    'PAGE_ACCESS_TOKEN': {
      required: true,
      validator: (value) => value && value.startsWith('EAAA') && value.length > 50,
      message: 'Must be valid Facebook Page Access Token (starts with EAAA)'
    },
    'VERIFY_TOKEN': {
      required: true,
      validator: (value) => value && value.length > 5,
      message: 'Must be at least 6 characters long'
    }
  };

  console.log('🔍 Variable Validation:');

  Object.entries(requiredVars).forEach(([varName, config]) => {
    const value = process.env[varName];

    if (!value) {
      console.log(`   ❌ ${varName}: Missing`);
      issues.push(`${varName} is missing`);
      isValid = false;
    } else if (!config.validator(value)) {
      console.log(`   ⚠️  ${varName}: Present but invalid`);
      console.log(`      → ${config.message}`);
      issues.push(`${varName}: ${config.message}`);
      isValid = false;
    } else {
      console.log(`   ✅ ${varName}: Valid`);
    }
  });

  // Additional validation checks
  console.log('\n🔧 Configuration Logic Checks:');

  // Check if domain looks like a real Vercel domain
  const domain = process.env.APP_DOMAIN;
  if (domain) {
    if (domain.includes('.vercel.app') || domain.includes('.com')) {
      console.log('   ✅ Domain format: Looks like valid domain');
    } else {
      console.log('   ⚠️  Domain format: Might not be valid');
      warnings.push('Domain should end with .vercel.app or a valid TLD');
    }
  }

  // Check if App IDs are different (they should be)
  const loginAppId = process.env.FACEBOOK_LOGIN_APP_ID;
  const messengerAppId = process.env.FACEBOOK_APP_ID;
  if (loginAppId && messengerAppId) {
    if (loginAppId === messengerAppId) {
      console.log('   ⚠️  App IDs: Both Login and Messenger App IDs are the same');
      warnings.push('Login and Messenger App IDs should typically be different');
    } else {
      console.log('   ✅ App IDs: Login and Messenger Apps are different');
    }
  }

  // Summary
  console.log('\n📊 Validation Summary:');

  if (isValid && warnings.length === 0) {
    console.log('🎉 All configuration looks good!');
    console.log('\n✅ Next steps:');
    console.log('1. Make sure these same variables are set in Vercel dashboard');
    console.log('2. Deploy your code to Vercel');
    console.log('3. Test messaging functionality');
  } else {
    if (issues.length > 0) {
      console.log('❌ Configuration Issues Found:');
      issues.forEach(issue => console.log(`   • ${issue}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Configuration Warnings:');
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    console.log('\n🔧 Action Required:');
    console.log('1. Update your .env file with actual values (not placeholders)');
    console.log('2. Get real IDs from Facebook Developer Console');
    console.log('3. Get your actual Vercel domain from Vercel dashboard');
    console.log('4. Run this validator again after updates');
  }

  console.log('\n🚀 Deployment Checklist:');
  console.log('□ Update .env with real values');
  console.log('□ Set same variables in Vercel environment variables');
  console.log('□ Configure Facebook webhook URL in Developer Console');
  console.log('□ Test webhook verification');
  console.log('□ Test bidirectional messaging');

  return isValid && issues.length === 0;
}

if (require.main === module) {
  const isValid = validateConfig();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateConfig };
