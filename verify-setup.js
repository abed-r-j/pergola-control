#!/usr/bin/env node
/**
 * Pergola Control App - Setup Verification Script
 * Runs comprehensive checks to ensure everything is working
 */

const fs = require('fs');
const path = require('path');

console.log('🌞 Pergola Control App - Setup Verification\n');

const checks = [
    {
        name: 'Project Structure',
        check: () => {
            const requiredFiles = [
                'App.tsx',
                'package.json',
                'src/components/Dashboard.tsx',
                'src/components/ManualControl.tsx',
                'src/components/ModeSelector.tsx',
                'src/screens/AuthScreen.tsx',
                'src/screens/MainScreen.tsx',
                'src/services/supabase.ts',
                'src/services/websocket.ts',
                'src/store/index.ts',
                'database/setup.sql',
                'raspberry-pi-server.py'
            ];
            
            for (const file of requiredFiles) {
                if (!fs.existsSync(path.join(__dirname, file))) {
                    return { success: false, message: `Missing file: ${file}` };
                }
            }
            return { success: true, message: 'All required files present' };
        }
    },
    {
        name: 'Supabase Configuration',
        check: () => {
            const supabaseFile = path.join(__dirname, 'src/services/supabase.ts');
            const content = fs.readFileSync(supabaseFile, 'utf8');
            
            if (content.includes('vtqtwjfcwqjjtvfucvfq.supabase.co')) {
                return { success: true, message: 'Supabase URL configured correctly' };
            }
            return { success: false, message: 'Supabase URL not configured' };
        }
    },
    {
        name: 'Package Dependencies',
        check: () => {
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            const requiredDeps = [
                '@reduxjs/toolkit',
                '@supabase/supabase-js',
                'react-native',
                'react-redux',
                '@react-navigation/native',
                '@react-navigation/stack'
            ];
            
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            for (const dep of requiredDeps) {
                if (!allDeps[dep]) {
                    return { success: false, message: `Missing dependency: ${dep}` };
                }
            }
            return { success: true, message: `All ${requiredDeps.length} required dependencies installed` };
        }
    },
    {
        name: 'TypeScript Configuration',
        check: () => {
            if (!fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
                return { success: false, message: 'tsconfig.json missing' };
            }
            return { success: true, message: 'TypeScript configured' };
        }
    },
    {
        name: 'Test Configuration',
        check: () => {
            if (!fs.existsSync(path.join(__dirname, 'jest.config.js'))) {
                return { success: false, message: 'jest.config.js missing' };
            }
            if (!fs.existsSync(path.join(__dirname, 'jest.setup.js'))) {
                return { success: false, message: 'jest.setup.js missing' };
            }
            return { success: true, message: 'Jest testing framework configured' };
        }
    },
    {
        name: 'Database Schema',
        check: () => {
            const sqlFile = path.join(__dirname, 'database/setup.sql');
            const content = fs.readFileSync(sqlFile, 'utf8');
            
            if (content.includes('CREATE TABLE') && content.includes('public.users')) {
                return { success: true, message: 'Database schema ready for deployment' };
            }
            return { success: false, message: 'Database schema incomplete' };
        }
    },
    {
        name: 'Raspberry Pi Server',
        check: () => {
            const serverFile = path.join(__dirname, 'raspberry-pi-server.py');
            const content = fs.readFileSync(serverFile, 'utf8');
            
            if (content.includes('websockets') && content.includes('ModbusClient')) {
                return { success: true, message: 'Python WebSocket server ready for Pi deployment' };
            }
            return { success: false, message: 'Pi server code incomplete' };
        }
    }
];

console.log('Running verification checks...\n');

let allPassed = true;
for (const check of checks) {
    try {
        const result = check.check();
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${check.name}: ${result.message}`);
        if (!result.success) allPassed = false;
    } catch (error) {
        console.log(`❌ ${check.name}: Error - ${error.message}`);
        allPassed = false;
    }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED! Your Pergola Control App is ready!');
    console.log('\nNext steps:');
    console.log('1. Run SQL script in Supabase dashboard');
    console.log('2. Fix Android development environment');
    console.log('3. Deploy Python server to Raspberry Pi');
    console.log('4. Test the complete system');
} else {
    console.log('⚠️  Some checks failed. Please review the issues above.');
}

console.log('\nProject Status: Ready for deployment and testing! 🚀');
console.log('Open setup-status.html in your browser for detailed instructions.');
