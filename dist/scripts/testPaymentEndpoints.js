"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_TOKEN = process.env.TEST_ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';
const results = [];
async function testPaymentStats() {
    try {
        console.log('🧪 Test 1: GET /stats/payments');
        const response = await axios_1.default.get(`${API_URL}/stats/payments`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.data.success && response.data.data) {
            results.push({
                test: 'Payment Stats Endpoint',
                status: 'PASS',
                message: 'Statistics retrieved successfully',
                data: {
                    totalPayments: response.data.data.totalPayments,
                    monthlyRevenue: response.data.data.monthlyRevenue,
                    semiAnnualRevenue: response.data.data.semiAnnualRevenue,
                    successRate: response.data.data.successRate
                }
            });
            console.log('✅ PASS: Statistics retrieved');
            console.log(`   - Total Payments: ${response.data.data.totalPayments}`);
            console.log(`   - Monthly Revenue: ${response.data.data.monthlyRevenue} XAF`);
            console.log(`   - Success Rate: ${response.data.data.successRate}%`);
        }
        else {
            throw new Error('Invalid response format');
        }
    }
    catch (error) {
        results.push({
            test: 'Payment Stats Endpoint',
            status: 'FAIL',
            message: error.response?.data?.message || error.message
        });
        console.log('❌ FAIL:', error.response?.data?.message || error.message);
    }
}
async function testPaymentsList() {
    try {
        console.log('\n🧪 Test 2: GET /stats/payments/all');
        const response = await axios_1.default.get(`${API_URL}/stats/payments/all`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: {
                page: 1,
                limit: 10
            }
        });
        if (response.data.success && response.data.data) {
            results.push({
                test: 'Payments List Endpoint',
                status: 'PASS',
                message: 'Payments list retrieved successfully',
                data: {
                    totalItems: response.data.data.pagination.totalItems,
                    currentPage: response.data.data.pagination.currentPage,
                    paymentsCount: response.data.data.payments.length
                }
            });
            console.log('✅ PASS: Payments list retrieved');
            console.log(`   - Total Items: ${response.data.data.pagination.totalItems}`);
            console.log(`   - Current Page: ${response.data.data.pagination.currentPage}`);
            console.log(`   - Payments in Response: ${response.data.data.payments.length}`);
        }
        else {
            throw new Error('Invalid response format');
        }
    }
    catch (error) {
        results.push({
            test: 'Payments List Endpoint',
            status: 'FAIL',
            message: error.response?.data?.message || error.message
        });
        console.log('❌ FAIL:', error.response?.data?.message || error.message);
    }
}
async function testPaymentsListWithFilters() {
    try {
        console.log('\n🧪 Test 3: GET /stats/payments/all (with status filter)');
        const response = await axios_1.default.get(`${API_URL}/stats/payments/all`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: {
                page: 1,
                limit: 10,
                status: 'SUCCESS'
            }
        });
        if (response.data.success && response.data.data) {
            const allSuccess = response.data.data.payments.every((p) => p.status === 'SUCCESS');
            if (allSuccess || response.data.data.payments.length === 0) {
                results.push({
                    test: 'Payments List with Filter',
                    status: 'PASS',
                    message: 'Filter working correctly',
                    data: {
                        successPayments: response.data.data.payments.length
                    }
                });
                console.log('✅ PASS: Filter working correctly');
                console.log(`   - Success Payments: ${response.data.data.payments.length}`);
            }
            else {
                throw new Error('Filter not working - found non-SUCCESS payments');
            }
        }
        else {
            throw new Error('Invalid response format');
        }
    }
    catch (error) {
        results.push({
            test: 'Payments List with Filter',
            status: 'FAIL',
            message: error.response?.data?.message || error.message
        });
        console.log('❌ FAIL:', error.response?.data?.message || error.message);
    }
}
async function testUnauthorizedAccess() {
    try {
        console.log('\n🧪 Test 4: Unauthorized Access (no token)');
        await axios_1.default.get(`${API_URL}/stats/payments`);
        results.push({
            test: 'Unauthorized Access Protection',
            status: 'FAIL',
            message: 'Endpoint accessible without token (security issue)'
        });
        console.log('❌ FAIL: Endpoint accessible without authentication');
    }
    catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            results.push({
                test: 'Unauthorized Access Protection',
                status: 'PASS',
                message: 'Endpoint properly protected'
            });
            console.log('✅ PASS: Endpoint properly protected (returned 401/403)');
        }
        else {
            results.push({
                test: 'Unauthorized Access Protection',
                status: 'FAIL',
                message: `Unexpected error: ${error.message}`
            });
            console.log('❌ FAIL:', error.message);
        }
    }
}
async function runTests() {
    console.log('🚀 Starting Payment Endpoints Tests\n');
    console.log('='.repeat(60));
    if (TEST_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
        console.log('⚠️  WARNING: Using placeholder token');
        console.log('   Set TEST_ADMIN_TOKEN environment variable for real tests');
        console.log('='.repeat(60));
    }
    await testPaymentStats();
    await testPaymentsList();
    await testPaymentsListWithFilters();
    await testUnauthorizedAccess();
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
    console.log('\n' + '='.repeat(60));
    console.log('DETAILED RESULTS:\n');
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.test}`);
        console.log(`   Status: ${result.status === 'PASS' ? '✅' : '❌'} ${result.status}`);
        console.log(`   Message: ${result.message}`);
        if (result.data) {
            console.log(`   Data:`, JSON.stringify(result.data, null, 2));
        }
        console.log('');
    });
    process.exit(failed > 0 ? 1 : 0);
}
runTests().catch(error => {
    console.error('💥 Fatal error running tests:', error);
    process.exit(1);
});
