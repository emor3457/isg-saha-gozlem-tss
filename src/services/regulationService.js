import db from '../database/db';

export async function saveComplianceEvaluation(regulationCode, articleNumber, data) {
    const existing = await db.complianceEvaluations
        .where({ regulationCode, articleNumber })
        .first();

    const evalData = {
        regulationCode,
        articleNumber,
        status: data.status,
        evaluatedBy: data.evaluatedBy || 'İSG Uzmanı',
        evaluatedAt: new Date().toISOString(),
        nextEvaluationDate: data.nextEvaluationDate || null
    };

    if (existing) {
        await db.complianceEvaluations.update(existing.id, evalData);
        return { ...existing, ...evalData };
    } else {
        const id = await db.complianceEvaluations.add(evalData);
        return { ...evalData, id };
    }
}

export async function getAllEvaluations() {
    return db.complianceEvaluations.toArray();
}

export async function getEvaluationsMap() {
    const evalList = await getAllEvaluations();
    const map = {};
    evalList.forEach(e => {
        if (!map[e.regulationCode]) map[e.regulationCode] = {};
        map[e.regulationCode][e.articleNumber] = e;
    });
    return map;
}

export async function getComplianceStats() {
    const map = await getEvaluationsMap(); // we might just use everything from DB directly
    const evals = await getAllEvaluations();
    return {
        totalEvaluated: evals.length,
        compliant: evals.filter(e => e.status === 'compliant').length,
        partial: evals.filter(e => e.status === 'partial').length,
        nonCompliant: evals.filter(e => e.status === 'non_compliant').length,
    };
}
