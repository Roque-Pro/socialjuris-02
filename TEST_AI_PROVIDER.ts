/**
 * TEST SCRIPT - AI Provider Migration Validation
 * 
 * Uso: Copie e execute no console do navegador (F12 → Console)
 * ou importe em um componente de teste
 */

// ============================================
// IMPORTS
// ============================================

// Descomente para usar em um arquivo .tsx
// import * as aiProvider from './services/aiProvider';
// import * as geminiService from './services/geminiService';
// import * as openaiService from './services/openaiService';

// ============================================
// TESTES
// ============================================

export const testAIProviderStatus = async () => {
    console.log('🧪 === AI PROVIDER TEST ===');
    
    try {
        // Test 1: Check provider detection
        const { getCurrentProvider, getProviderStatus } = await import('./services/aiProvider');
        const provider = getCurrentProvider();
        const status = getProviderStatus();
        
        console.log(`✅ Provider Detected: ${provider.toUpperCase()}`);
        console.log('Status:', status);
        
        return {
            success: true,
            provider,
            status
        };
    } catch (error) {
        console.error('❌ Provider detection failed:', error);
        return {
            success: false,
            error
        };
    }
};

export const testAnalyzeCaseDescription = async () => {
    console.log('🧪 === TEST: analyzeCaseDescription ===');
    
    const testCase = `
        Cliente: João da Silva
        Problema: Vizinho invadiu terreno e construiu muro
        Duração: 2 anos
        Dano: Perda de espaço de 5m²
    `;
    
    try {
        const { analyzeCaseDescription } = await import('./services/aiProvider');
        const result = await analyzeCaseDescription(testCase);
        
        console.log('✅ Result:', result);
        console.log('Area:', result.area);
        console.log('Complexity:', result.complexity);
        
        return { success: true, result };
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
    }
};

export const testGenerateWelcomeMessage = async () => {
    console.log('🧪 === TEST: generateWelcomeMessage ===');
    
    try {
        const { generateWelcomeMessage } = await import('./services/aiProvider');
        const message = await generateWelcomeMessage('Maria');
        
        console.log('✅ Welcome Message:', message);
        return { success: true, message };
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
    }
};

export const testChatWithClientAI = async () => {
    console.log('🧪 === TEST: chatWithClientAI ===');
    
    const question = 'Qual é o prazo para contestar uma ação civil?';
    
    try {
        const { chatWithClientAI } = await import('./services/aiProvider');
        const response = await chatWithClientAI(question);
        
        console.log('✅ Chat Response:', response);
        return { success: true, response };
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
    }
};

export const testAnalyzeContractRisks = async () => {
    console.log('🧪 === TEST: analyzeContractRisks ===');
    
    const contractText = `
        CONTRATO DE LOCAÇÃO
        
        LOCADOR: João Santos
        LOCATÁRIO: Maria Silva
        
        VALOR: R$ 2.000,00/mês
        DURAÇÃO: 24 meses
        DATA INÍCIO: 01/03/2025
        
        CLÁUSULA 5: O locatário é responsável por todas as manutenções
        CLÁUSULA 7: Multa por atraso: 5% ao mês
    `;
    
    try {
        const { analyzeContractRisks } = await import('./services/aiProvider');
        const result = await analyzeContractRisks(contractText);
        
        console.log('✅ Contract Analysis:', result);
        console.log('Critical Clauses:', result.criticalClauses);
        return { success: true, result };
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
    }
};

export const testSuggestDeadlines = async () => {
    console.log('🧪 === TEST: suggestDeadlines ===');
    
    try {
        const { suggestDeadlines } = await import('./services/aiProvider');
        const result = await suggestDeadlines(
            'Contestação de ação civil',
            'Requerida contestação de ação de cobrança',
            'Judicial'
        );
        
        console.log('✅ Deadline Suggestion:', result);
        console.log('Suggested Date:', result.suggestedDate);
        console.log('Prep Days:', result.preparationDays);
        return { success: true, result };
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
    }
};

export const testGenerateLegalDraft = async () => {
    console.log('🧪 === TEST: generateLegalDraft ===');
    
    try {
        const { generateLegalDraft } = await import('./services/aiProvider');
        const draft = await generateLegalDraft({
            type: 'Peticao',
            clientName: 'João da Silva',
            facts: 'Vizinho invadiu meu terreno e construiu um muro não autorizado',
            tone: 'formal'
        });
        
        console.log('✅ Draft Generated');
        console.log('Length:', draft.length);
        console.log('Preview:', draft.substring(0, 200) + '...');
        return { success: true, draft };
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
    }
};

// ============================================
// RUN ALL TESTS
// ============================================

export const runAllAITests = async () => {
    console.clear();
    console.log('🚀 === RUNNING ALL AI PROVIDER TESTS ===\n');
    
    const results = {
        providerStatus: null,
        analyzeCaseDescription: null,
        generateWelcomeMessage: null,
        chatWithClientAI: null,
        analyzeContractRisks: null,
        suggestDeadlines: null,
        generateLegalDraft: null
    };
    
    // Test 1
    console.log('\n📋 Test 1: Provider Status');
    results.providerStatus = await testAIProviderStatus();
    
    // Test 2
    console.log('\n📋 Test 2: Analyze Case Description');
    results.analyzeCaseDescription = await testAnalyzeCaseDescription();
    
    // Test 3
    console.log('\n📋 Test 3: Generate Welcome Message');
    results.generateWelcomeMessage = await testGenerateWelcomeMessage();
    
    // Test 4
    console.log('\n📋 Test 4: Chat with Client AI');
    results.chatWithClientAI = await testChatWithClientAI();
    
    // Test 5
    console.log('\n📋 Test 5: Analyze Contract Risks');
    results.analyzeContractRisks = await testAnalyzeContractRisks();
    
    // Test 6
    console.log('\n📋 Test 6: Suggest Deadlines');
    results.suggestDeadlines = await testSuggestDeadlines();
    
    // Test 7 (mais lento - executar por último)
    console.log('\n📋 Test 7: Generate Legal Draft');
    results.generateLegalDraft = await testGenerateLegalDraft();
    
    // Summary
    console.log('\n\n📊 === TEST SUMMARY ===');
    const passed = Object.values(results).filter(r => r?.success).length;
    const total = Object.keys(results).length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log('Results:', results);
    
    return results;
};

// ============================================
// QUICK DIAGNOSTICS
// ============================================

export const quickDiagnostics = async () => {
    console.log('🔍 === QUICK DIAGNOSTICS ===\n');
    
    const checks = {
        viteOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
        viteGeminiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
        viteAIProvider: import.meta.env.VITE_AI_PROVIDER || 'not set',
        hasOpenAIModule: false,
        hasGeminiModule: false
    };
    
    try {
        await import('openai');
        checks.hasOpenAIModule = true;
    } catch (e) {
        console.warn('⚠️ OpenAI module not found');
    }
    
    try {
        await import('@google/genai');
        checks.hasGeminiModule = true;
    } catch (e) {
        console.warn('⚠️ Gemini module not found');
    }
    
    console.table(checks);
    
    if (checks.viteOpenAIKey) {
        console.log('✅ OpenAI API Key: FOUND');
    } else {
        console.warn('⚠️ OpenAI API Key: NOT FOUND - add VITE_OPENAI_API_KEY to .env');
    }
    
    if (checks.viteGeminiKey) {
        console.log('✅ Gemini API Key: FOUND (fallback available)');
    } else {
        console.warn('⚠️ Gemini API Key: NOT FOUND');
    }
    
    return checks;
};

// ============================================
// USAGE IN CONSOLE
// ============================================

/*
// Copie e cole no console do navegador (F12):

// 1. Quick check
await import('./TEST_AI_PROVIDER.ts').then(m => m.quickDiagnostics());

// 2. Test provider status
await import('./TEST_AI_PROVIDER.ts').then(m => m.testAIProviderStatus());

// 3. Run all tests
await import('./TEST_AI_PROVIDER.ts').then(m => m.runAllAITests());

// 4. Individual tests
await import('./TEST_AI_PROVIDER.ts').then(m => m.testGenerateWelcomeMessage());
await import('./TEST_AI_PROVIDER.ts').then(m => m.testAnalyzeCaseDescription());
await import('./TEST_AI_PROVIDER.ts').then(m => m.testChatWithClientAI());

*/

export default {
    testAIProviderStatus,
    testAnalyzeCaseDescription,
    testGenerateWelcomeMessage,
    testChatWithClientAI,
    testAnalyzeContractRisks,
    testSuggestDeadlines,
    testGenerateLegalDraft,
    runAllAITests,
    quickDiagnostics
};
