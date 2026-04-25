import db from '../database/db';
import { calculateRiskScore, getRiskLevel, getRecommendedActions } from '../config/fineKinney';
import { addToSyncQueue } from './syncService';

/**
 * Denetim izini yerel veritabanına kaydeder
 */
async function logLocalAudit(action, tableName, recordId, data) {
    try {
        const logEntry = {
            action,
            tableName,
            recordId,
            data: JSON.stringify(data),
            timestamp: new Date().toISOString()
        };
        const id = await db.system_audit_logs.add(logEntry);
        // Sync Kuyruğuna Ekle
        await addToSyncQueue('system_audit_logs', id, 'create', logEntry);
    } catch (err) {
        console.error('[LocalAudit] Error:', err);
    }
}

export async function createHazard(data) {
    const riskScore = calculateRiskScore(data.probability, data.frequency, data.severity);
    const riskLevel = getRiskLevel(riskScore);
    const hazard = {
        ...data,
        hazardSource: data.hazardSource || '',
        hazardDescription: data.hazardDescription || '',
        potentialImpact: data.potentialImpact || '',
        riskScore,
        riskLevel: riskLevel.level,
        riskLabel: riskLevel.label,
        riskColor: riskLevel.color,
        recommendedActions: getRecommendedActions(riskLevel.level, data.type),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const id = await db.hazards.add(hazard);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('hazards', id, 'create', hazard);
    await logLocalAudit('CREATE', 'hazards', id, hazard);

    return { ...hazard, id };
}

export async function updateHazard(id, changes) {
    const existing = await db.hazards.get(id);
    let updates = { 
        ...changes, 
        updatedAt: new Date().toISOString() 
    };
    
    if (changes.probability !== undefined || changes.frequency !== undefined || changes.severity !== undefined) {
        const p = changes.probability ?? existing.probability;
        const f = changes.frequency ?? existing.frequency;
        const s = changes.severity ?? existing.severity;
        const riskScore = calculateRiskScore(p, f, s);
        const riskLevel = getRiskLevel(riskScore);
        updates = {
            ...updates,
            riskScore,
            riskLevel: riskLevel.level,
            riskLabel: riskLevel.label,
            riskColor: riskLevel.color,
            recommendedActions: getRecommendedActions(riskLevel.level, existing.type)
        };
    }
    await db.hazards.update(id, updates);
    const updated = await db.hazards.get(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('hazards', id, 'update', updated);
    await logLocalAudit('UPDATE', 'hazards', id, updated);

    return updated;
}

export async function deleteHazard(id) {
    const existing = await db.hazards.get(id);
    await db.hazards.delete(id);

    // Sync Kuyruğuna Ekle
    await addToSyncQueue('hazards', id, 'delete', { id });
    await logLocalAudit('DELETE', 'hazards', id, existing);
}

export async function getHazardsByObservation(observationId) {
    return db.hazards.where('observationId').equals(observationId).toArray();
}

export async function getAllHazards() {
    return db.hazards.orderBy('riskScore').reverse().toArray();
}

export async function getHazardStats() {
    const all = await getAllHazards();
    return {
        total: all.length,
        byLevel: {
            'very-high': all.filter(h => h.riskLevel === 'very-high').length,
            'high': all.filter(h => h.riskLevel === 'high').length,
            'medium': all.filter(h => h.riskLevel === 'medium').length,
            'low': all.filter(h => h.riskLevel === 'low').length,
            'very-low': all.filter(h => h.riskLevel === 'very-low').length,
        },
        averageScore: all.length > 0 ? Math.round(all.reduce((sum, h) => sum + h.riskScore, 0) / all.length) : 0
    };
}

// ── Root Cause Analysis (6.1.2) ──
export async function createRootCause(data) {
    const rc = {
        ...data,
        createdAt: new Date().toISOString()
    };
    const id = await db.rootCauses.add(rc);
    return { ...rc, id };
}

export async function getRootCausesByParent(parentId, parentType) {
    return db.rootCauses.where({ parentId, parentType }).toArray();
}

export async function deleteRootCause(id) {
    await db.rootCauses.delete(id);
}

// ── Opportunities (6.1.2) ──
export async function createOpportunity(data) {
    const opp = {
        ...data,
        status: data.status || 'open',
        createdAt: new Date().toISOString()
    };
    const id = await db.opportunities.add(opp);
    return { ...opp, id };
}

export async function getAllOpportunities() {
    return db.opportunities.orderBy('createdAt').reverse().toArray();
}

export async function updateOpportunity(id, changes) {
    await db.opportunities.update(id, changes);
    return db.opportunities.get(id);
}

export async function deleteOpportunity(id) {
    await db.opportunities.delete(id);
}
