import { Router } from 'express';
import {
  getAllRoles,
  getRoleById,
  getAllPermissions,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
} from '../controllers/roleController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.get('/roles', requirePermission('manage_roles'), getAllRoles);
router.get('/roles/:id', requirePermission('manage_roles'), getRoleById);
router.post('/roles', requirePermission('manage_roles'), createRole);
router.put('/roles/:id', requirePermission('manage_roles'), updateRole);
router.delete('/roles/:id', requirePermission('manage_roles'), deleteRole);
router.patch('/roles/:id/permissions', requirePermission('manage_roles'), updateRolePermissions);

router.get('/permissions', requirePermission('manage_roles'), getAllPermissions);

export default router;
