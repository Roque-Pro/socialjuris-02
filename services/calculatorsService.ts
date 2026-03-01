import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// ===== ÍNDICES BRASILEIROS SIMULADOS (em produção, consumir API externa) =====
export const getCurrentIndices = async () => {
  return {
    SELIC: 10.50, // % a.a. (simulado - atualizar via BCB)
    IPCA: 4.85, // % a.a. acumulado
    INPC: 4.47, // % a.a. acumulado (IBGE)
    IGPM: 5.62, // % a.a. acumulado (FGV) - índice de reajuste de contratos
    TR: 0.4385, // Taxa Referencial
    CDI: 10.65, // % a.a.
    UFEBRASILDeJaneiro2025: 325.18,
    salarioMinimoMensal: 1412.00,
    salarioMinimoHora: 6.84,
  };
};

// ===== CALCULADORA TRABALHISTA =====

export const calculateRescisaoCompleta = async (inputs: {
  salarioBase: number;
  dataAdmissao: string;
  dataRescisao: string;
  teveComissoes?: number;
  temAviso?: boolean;
  temFGTSAtraso?: boolean;
}) => {
  const datAdm = new Date(inputs.dataAdmissao);
  const datResc = new Date(inputs.dataRescisao);
  const diasTrabalhados = Math.floor((datResc.getTime() - datAdm.getTime()) / (1000 * 60 * 60 * 24));
  const anosCompletos = Math.floor(diasTrabalhados / 365);
  const indices = await getCurrentIndices();

  // Cálculos conforme Lei nº 8.036/90 (FGTS) e CLT
  const saldoFGTS = inputs.salarioBase * 0.08 * (diasTrabalhados / 30); // 8% do salário
  const multaFGTS = saldoFGTS * 0.40; // 40% se rescisão sem justa causa
  const avioPrevio = inputs.temAviso ? inputs.salarioBase : 0;
  const ferias = (inputs.salarioBase / 12) * Math.ceil(diasTrabalhados / 30); // Proporcionais
  const decimoTerceiro = (inputs.salarioBase / 12) * Math.ceil(diasTrabalhados / 30);
  const comissoes = inputs.teveComissoes || 0;
  
  const total = saldoFGTS + multaFGTS + avioPrevio + ferias + decimoTerceiro + comissoes;

  return {
    total,
    summary: `Rescisão contabilizada para ${anosCompletos} anos completos e ${diasTrabalhados % 365} dias. Sem justa causa (multa FGTS 40% incidida).`,
    details: [
      { label: "Saldo FGTS Depositado", value: `R$ ${saldoFGTS.toFixed(2)}`, description: "8% × período trabalhado (CLT Art. 15)" },
      { label: "Multa FGTS (40%)", value: `R$ ${multaFGTS.toFixed(2)}`, description: "Lei nº 8.036/90 - Rescisão sem justa causa" },
      { label: "Aviso Prévio Indenizado", value: `R$ ${avioPrevio.toFixed(2)}`, description: "1 salário-base (CLT Art. 488)" },
      { label: "Férias Proporcionais", value: `R$ ${ferias.toFixed(2)}`, description: "Direito + 1/3 (CF/88 Art. 7º, XVII)" },
      { label: "13º Proporcional", value: `R$ ${decimoTerceiro.toFixed(2)}`, description: "Lei nº 4.090/62" },
      { label: "Comissões/Outras", value: `R$ ${comissoes.toFixed(2)}`, description: "Valores variáveis conforme contrato" },
    ]
  };
};

export const calculateFerias = async (inputs: {
  salarioBase: number;
  diasFeria: number; // 30, 20, 10 dias proporcionais
  incluirTerco: boolean;
}) => {
  const valorFerias = (inputs.salarioBase / 30) * inputs.diasFeria;
  const tercoConstitucional = inputs.incluirTerco ? valorFerias / 3 : 0;
  const total = valorFerias + tercoConstitucional;

  return {
    total,
    summary: `Cálculo de ${inputs.diasFeria} dias de férias ${inputs.incluirTerco ? 'com 1/3 adicional' : 'sem adicionais'} (CF/88 Art. 7º, XVII)`,
    details: [
      { label: "Valor Base Férias", value: `R$ ${valorFerias.toFixed(2)}`, description: `${inputs.diasFeria} dias × (salário/30)` },
      { label: "1/3 Constitucional", value: `R$ ${tercoConstitucional.toFixed(2)}`, description: "Direito constitucional de abono (CF/88)" },
    ]
  };
};

export const calculateHorasExtras = async (inputs: {
  salarioBase: number;
  horasExtrasMes: number;
  adicional: number; // 50 ou 100
}) => {
  const valorHora = inputs.salarioBase / 220; // Base 220h/mês
  const adicionalPercent = inputs.adicional / 100;
  const valorHoraExtra = valorHora * (1 + adicionalPercent);
  const totalMes = valorHoraExtra * inputs.horasExtrasMes;

  return {
    total: totalMes,
    summary: `${inputs.horasExtrasMes}h extras a ${inputs.adicional}% (CLT Art. 59 c/c Súmula STF 431)`,
    details: [
      { label: "Valor Hora Normal", value: `R$ ${valorHora.toFixed(2)}`, description: "Salário ÷ 220 (CLT Art. 64)" },
      { label: "Adicional Noturno/Extra", value: `${inputs.adicional}%`, description: "CLT Art. 73 e 59" },
      { label: "Valor Hora Extra", value: `R$ ${valorHoraExtra.toFixed(2)}`, description: "Valor hora × (1 + adicional)" },
      { label: "Total do Mês", value: `R$ ${totalMes.toFixed(2)}`, description: `${inputs.horasExtrasMes} horas × valor hora extra` },
    ]
  };
};

// ===== CALCULADORA CÍVEL =====

export const calculateCorrecaoMonetaria = async (inputs: {
  valorOriginal: number;
  dataInicial: string;
  dataFinal: string;
  indice: 'IPCA' | 'INPC' | 'IGPM' | 'TR' | 'SELIC' | 'CDI'; // Depende do tipo de débito
}) => {
  const indices = await getCurrentIndices();
  const datIni = new Date(inputs.dataInicial);
  const datFim = new Date(inputs.dataFinal);
  const meses = Math.ceil((datFim.getTime() - datIni.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  // Simulação: usar taxa média mensal para o período
  let taxaMensal = 0;
  let descricaoIndice = '';
  
  switch (inputs.indice) {
    case 'IPCA':
      taxaMensal = indices.IPCA / 100 / 12;
      descricaoIndice = 'IPCA (Índice de Preços ao Consumidor Amplo - IBGE)';
      break;
    case 'INPC':
      taxaMensal = indices.INPC / 100 / 12;
      descricaoIndice = 'INPC (Índice Nacional de Preços ao Consumidor - IBGE)';
      break;
    case 'IGPM':
      taxaMensal = indices.IGPM / 100 / 12;
      descricaoIndice = 'IGP-M (Índice Geral de Preços - Mercado, FGV) - Reajuste de contratos';
      break;
    case 'TR':
      taxaMensal = indices.TR / 100;
      descricaoIndice = 'TR (Taxa Referencial - BCB)';
      break;
    case 'SELIC':
      taxaMensal = indices.SELIC / 100 / 12;
      descricaoIndice = 'SELIC (Sistema Especial de Liquidação e Custódia - BCB)';
      break;
    case 'CDI':
      taxaMensal = indices.CDI / 100 / 12;
      descricaoIndice = 'CDI (Certificado de Depósito Interbancário) - Juros sobre capitais';
      break;
  }

  const valorCorrigido = inputs.valorOriginal * Math.pow(1 + taxaMensal, meses);
  const correcao = valorCorrigido - inputs.valorOriginal;

  return {
    total: valorCorrigido,
    summary: `Débito atualizado por ${meses} meses via índice ${inputs.indice} conforme Lei nº 6.899/81 (Decreto-lei 2.397)`,
    details: [
      { label: "Valor Original", value: `R$ ${inputs.valorOriginal.toFixed(2)}`, description: "Débito inicial" },
      { label: "Índice de Correção", value: inputs.indice, description: descricaoIndice },
      { label: "Taxa Média Mensal", value: `${(taxaMensal * 100).toFixed(4)}%`, description: "Taxa aplicada mensalmente ao período" },
      { label: "Períodos (meses)", value: meses.toString(), description: `${datIni.toLocaleDateString('pt-BR')} a ${datFim.toLocaleDateString('pt-BR')}` },
      { label: "Valor Corrigido", value: `R$ ${valorCorrigido.toFixed(2)}`, description: "Valor original × fator de correção" },
      { label: "Correção Monetária", value: `R$ ${correcao.toFixed(2)}`, description: "Diferença acumulada" },
    ]
  };
};

export const calculateJurosMoratorios = async (inputs: {
  valorDevido: number;
  dataVencimento: string;
  dataPagamento: string;
  tipoDebito: 'Contratual' | 'Legal'; // Art. 406 CC (juros legais = SELIC)
}) => {
  const indices = await getCurrentIndices();
  const datVenc = new Date(inputs.dataVencimento);
  const datPag = new Date(inputs.dataPagamento);
  const diasAtraso = Math.ceil((datPag.getTime() - datVenc.getTime()) / (1000 * 60 * 60 * 24));
  
  // Juros: 1% a.m. (legal) ou conforme contrato + SELIC após 2018
  const taxaMensal = 0.01; // 1% - juros legais de mora (CC Art. 406)
  const meses = diasAtraso / 30;
  const juros = inputs.valorDevido * taxaMensal * meses;

  return {
    total: inputs.valorDevido + juros,
    summary: `Juros de mora ${inputs.tipoDebito === 'Legal' ? '(1% a.m. - CC Art. 406)' : '(conforme contrato)'} por ${diasAtraso} dias`,
    details: [
      { label: "Valor Devido", value: `R$ ${inputs.valorDevido.toFixed(2)}`, description: "Débito principal" },
      { label: "Data Vencimento", value: datVenc.toLocaleDateString('pt-BR'), description: "Vencimento original" },
      { label: "Dias de Atraso", value: diasAtraso.toString(), description: "Do vencimento até pagamento" },
      { label: "Taxa de Mora", value: "1% a.m.", description: "CC Art. 406, II" },
      { label: "Juros de Mora", value: `R$ ${juros.toFixed(2)}`, description: `${(meses * 100).toFixed(2)} meses × 1%` },
      { label: "Valor Total", value: `R$ ${(inputs.valorDevido + juros).toFixed(2)}`, description: "Débito + juros" },
    ]
  };
};

// ===== CALCULADORA PREVIDENCIÁRIA (Simplificada) =====

export const calculateAposentadoriaIdade = async (inputs: {
  dataNascimento: string;
  dataInicio: string; // Primeira contribuição
  sexo: 'M' | 'F';
}) => {
  const datNasc = new Date(inputs.dataNascimento);
  const datIni = new Date(inputs.dataInicio);
  
  // Requisitos: 62 (mulher) ou 65 (homem) + 15 anos contribuição
  const idadeAtual = new Date().getFullYear() - datNasc.getFullYear();
  const tempoContribuicao = new Date().getFullYear() - datIni.getFullYear();
  
  const idadeRequerida = inputs.sexo === 'F' ? 62 : 65;
  const tempoRequerido = 15;
  
  const atingeIdade = idadeAtual >= idadeRequerida ? "✓ Sim" : `✗ Faltam ${idadeRequerida - idadeAtual} anos`;
  const atingeTempo = tempoContribuicao >= tempoRequerido ? "✓ Sim" : `✗ Faltam ${tempoRequerido - tempoContribuicao} anos`;

  return {
    total: 0, // Simulado
    summary: `Aposentadoria por idade conforme LC nº 142/13 (novo regime) - Análise de elegibilidade`,
    details: [
      { label: "Idade Atual", value: `${idadeAtual} anos`, description: "Calculada a partir de hoje" },
      { label: "Idade Requerida", value: `${idadeRequerida} anos`, description: `${inputs.sexo === 'F' ? 'Mulheres' : 'Homens'} (LC nº 142/13)` },
      { label: "Atinge Idade?", value: atingeIdade, description: "Status do requisito" },
      { label: "Tempo de Contribuição", value: `${tempoContribuicao} anos`, description: `Desde ${datIni.getFullYear()}` },
      { label: "Tempo Requerido", value: `${tempoRequerido} anos`, description: "Mínimo exigido (LC nº 142/13)" },
      { label: "Atingiu Tempo?", value: atingeTempo, description: "Status do requisito" },
    ]
  };
};

// ===== CALCULADORA TRIBUTÁRIA (Simplificada) =====

export const calculateSELIC = async (inputs: {
  valorDebito: number;
  dataPrincipal: string;
  dataPagamento: string;
}) => {
  const indices = await getCurrentIndices();
  const datPrinc = new Date(inputs.dataPrincipal);
  const datPag = new Date(inputs.dataPagamento);
  const meses = Math.ceil((datPag.getTime() - datPrinc.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  const taxaMensal = indices.SELIC / 100 / 12;
  const juros = inputs.valorDebito * taxaMensal * meses;

  return {
    total: inputs.valorDebito + juros,
    summary: `SELIC acumulada por ${meses} meses à taxa média de ${(taxaMensal * 100).toFixed(2)}% a.m.`,
    details: [
      { label: "Débito Fiscal", value: `R$ ${inputs.valorDebito.toFixed(2)}`, description: "Valor principal do débito" },
      { label: "Taxa SELIC Média", value: `${indices.SELIC.toFixed(2)}% a.a.`, description: `(${(taxaMensal * 100).toFixed(2)}% a.m.)` },
      { label: "Períodos (meses)", value: meses.toString(), description: `${datPrinc.toLocaleDateString('pt-BR')} a ${datPag.toLocaleDateString('pt-BR')}` },
      { label: "Juros SELIC", value: `R$ ${juros.toFixed(2)}`, description: "Atualização monetária do débito" },
      { label: "Total a Pagar", value: `R$ ${(inputs.valorDebito + juros).toFixed(2)}`, description: "Débito + SELIC" },
    ]
  };
};

// ===== CALCULADORA FAMÍLIA =====

export const calculatePensaoAlimenticia = async (inputs: {
  rendaMensal: number;
  numeroFilhos: number;
  percentualAlimentista?: number; // default 20%
  temOutrasObrigacoes?: boolean;
}) => {
  const indices = await getCurrentIndices();
  const percentual = (inputs.percentualAlimentista || 20) / 100;
  const deducoes = inputs.temOutrasObrigacoes ? inputs.rendaMensal * 0.2 : 0; // Outras obrigações
  const rendaDisponivel = inputs.rendaMensal - deducoes;
  const pensao = rendaDisponivel * percentual;
  const pensaoPorFilho = pensao / inputs.numeroFilhos;

  return {
    total: pensao,
    summary: `Pensão alimentícia para ${inputs.numeroFilhos} filho(s) a ${(percentual * 100).toFixed(0)}% da renda disponível (CC Art. 1694)`,
    details: [
      { label: "Renda Mensal", value: `R$ ${inputs.rendaMensal.toFixed(2)}`, description: "Vencimentos líquidos" },
      { label: "Deduções", value: `R$ ${deducoes.toFixed(2)}`, description: inputs.temOutrasObrigacoes ? "Outras obrigações" : "Nenhuma" },
      { label: "Renda Disponível", value: `R$ ${rendaDisponivel.toFixed(2)}`, description: "Renda - deduções" },
      { label: "Percentual Pensão", value: `${(percentual * 100).toFixed(0)}%`, description: "Conforme capacidade econômica" },
      { label: "Pensão Total", value: `R$ ${pensao.toFixed(2)}`, description: `${inputs.numeroFilhos} filho(s)` },
      { label: "Pensão por Filho", value: `R$ ${pensaoPorFilho.toFixed(2)}`, description: "Divisão proporcional" },
    ]
  };
};

// ===== CALCULADORA PROCESSUAL =====

export const calculateHonorarios = async (inputs: {
  causaValor: number;
  complexidade: 'Baixa' | 'Média' | 'Alta';
  foiVencido: boolean; // Sucumbência
}) => {
  // Tabela Mínima OAB (Lei nº 8.906/94) - Fixada em UFEBRASIL
  // Tabela: 10% para baixa, 15% para média, 20% para alta
  const indices = await getCurrentIndices();
  
  const percentuais = {
    'Baixa': 0.10,
    'Média': 0.15,
    'Alta': 0.20,
  };

  const honorarios = inputs.causaValor * percentuais[inputs.complexidade];
  const sucumbenciaPercent = inputs.foiVencido ? 0.05 : 0; // Sucumbência 5%
  const sucumbencia = inputs.causaValor * sucumbenciaPercent;
  const total = honorarios + sucumbencia;

  return {
    total,
    summary: `Honorários advocatícios ${inputs.complexidade} ${inputs.foiVencido ? '+ sucumbência (5%)' : ''} (OAB Tabela Mínima)`,
    details: [
      { label: "Valor da Causa", value: `R$ ${inputs.causaValor.toFixed(2)}`, description: "Patrimonial do conflito" },
      { label: "Complexidade", value: inputs.complexidade, description: "Classificação da demanda" },
      { label: "Percentual Honorários", value: `${(percentuais[inputs.complexidade] * 100).toFixed(0)}%`, description: "Tabela OAB mínima (Lei nº 8.906/94)" },
      { label: "Honorários Advocatícios", value: `R$ ${honorarios.toFixed(2)}`, description: "Contratos, elaboração, consultoria" },
      { label: "Sucumbência", value: `R$ ${sucumbencia.toFixed(2)}`, description: inputs.foiVencido ? "Condenação (5% do causa)" : "Vitória - sem sucumbência" },
      { label: "Total", value: `R$ ${total.toFixed(2)}`, description: "Honorários + sucumbência" },
    ]
  };
};

export const calculatePrazoCPC = (inputs: {
  eventoDatas: string; // Data do evento processual
  tipoPrazo: 'Recurso' | 'Resposta' | 'Intimacao';
}) => {
  const dataEvento = new Date(inputs.eventoDatas);
  let prazoEmDias = 0;
  let fundamento = '';

  switch (inputs.tipoPrazo) {
    case 'Recurso':
      prazoEmDias = 15;
      fundamento = "CPC Art. 1004 - 15 dias para recurso ordinário";
      break;
    case 'Resposta':
      prazoEmDias = 15;
      fundamento = "CPC Art. 335 - 15 dias para contestação";
      break;
    case 'Intimacao':
      prazoEmDias = 5;
      fundamento = "CPC Art. 275 - 5 dias para comparecimento";
      break;
  }

  const dataFinal = new Date(dataEvento.getTime() + prazoEmDias * 24 * 60 * 60 * 1000);

  return {
    total: prazoEmDias,
    summary: `Prazo de ${prazoEmDias} dias a contar de ${dataEvento.toLocaleDateString('pt-BR')} (${fundamento})`,
    details: [
      { label: "Tipo de Prazo", value: inputs.tipoPrazo, description: "Natureza do ato processual" },
      { label: "Data do Evento", value: dataEvento.toLocaleDateString('pt-BR'), description: "Dia zero" },
      { label: "Duração", value: `${prazoEmDias} dias`, description: fundamento },
      { label: "Vencimento", value: dataFinal.toLocaleDateString('pt-BR'), description: "Último dia para praticar ato" },
      { label: "Observação", value: "Não inclusos domingos e feriados", description: "CPC Art. 219 § 1º" },
    ]
  };
};
