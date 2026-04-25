import db from '../database/db';

export async function createEmergencyPlan(data) {
    const plan = {
        title: data.title,
        type: data.type,
        location: data.location,
        lastReviewDate: data.lastReviewDate,
        nextReviewDate: data.nextReviewDate,
        status: data.status || 'draft',
        createdAt: new Date().toISOString()
    };
    const id = await db.emergencyPlans.add(plan);
    return { ...plan, id };
}

export async function getAllEmergencyPlans() {
    return db.emergencyPlans.orderBy('createdAt').reverse().toArray();
}

export async function updateEmergencyPlan(id, updates) {
    await db.emergencyPlans.update(id, updates);
    return db.emergencyPlans.get(id);
}

export async function deleteEmergencyPlan(id) {
    await db.drills.where('planId').equals(id).delete();
    await db.emergencyPlans.delete(id);
}

// ── Tatbikat İşlemleri ──

export async function createDrill(data) {
    const drill = {
        planId: data.planId,
        date: data.date,
        type: data.type,
        scenario: data.scenario,
        participantsCount: parseInt(data.participantsCount, 10),
        evaluationScore: parseInt(data.evaluationScore, 10),
        status: data.status || 'planned',
        createdAt: new Date().toISOString()
    };
    const id = await db.drills.add(drill);
    return { ...drill, id };
}

export async function getDrillsByPlanId(planId) {
    return db.drills.where('planId').equals(planId).reverse().sortBy('date');
}

export async function updateDrill(id, updates) {
    await db.drills.update(id, updates);
    return db.drills.get(id);
}

export async function deleteDrill(id) {
    await db.drills.delete(id);
}

// ── İstatistikler ──

export async function getEmergencyStats() {
    const plans = await db.emergencyPlans.toArray();
    const drills = await db.drills.toArray();

    return {
        totalPlans: plans.length,
        activePlans: plans.filter(p => p.status === 'active').length,
        needsReview: plans.filter(p => p.status === 'needs_review' || p.status === 'outdated').length,
        totalDrills: drills.length,
        completedDrills: drills.filter(d => d.status === 'completed').length,
        needsImprovementDrills: drills.filter(d => d.status === 'needs_improvement' || d.status === 'failed').length
    };
}
