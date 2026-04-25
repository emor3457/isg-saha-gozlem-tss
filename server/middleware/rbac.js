/**
 * Rol Bazlı Erişim Kontrolü (RBAC) Middleware
 * Roller: admin, isg_expert, dept_manager, employee, external_auditor
 */

/**
 * Belirtilen rollerden birine sahip olmayı zorunlu kılar
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmuyor' });
        }
        next();
    };
}

/**
 * Departman filtreleme middleware
 * dept_manager sadece kendi departmanını, employee sadece kendi kayıtlarını görebilir
 */
function applyDataScope(req, res, next) {
    req.dataScope = { orgId: req.user.orgId };

    switch (req.user.role) {
        case 'admin':
        case 'isg_expert':
            // Tüm org verisine erişim
            break;
        case 'dept_manager':
            req.dataScope.department = req.user.department;
            break;
        case 'employee':
            req.dataScope.createdBy = req.user.userId;
            break;
        case 'external_auditor':
            req.dataScope.readOnly = true;
            break;
    }
    next();
}

/**
 * Yazma işlemi yetkisi (external_auditor engellemesi)
 */
function requireWrite(req, res, next) {
    if (req.user.role === 'external_auditor') {
        return res.status(403).json({ error: 'Dış denetçiler bu modülde yazma işlemi yapamaz' });
    }
    next();
}

module.exports = { requireRole, applyDataScope, requireWrite };
