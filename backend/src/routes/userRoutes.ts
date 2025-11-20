import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword,
} from '../controllers/userController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.get('/', requirePermission('view_users'), getAllUsers);
router.get('/:id', requirePermission('view_users'), getUserById);
router.post('/', requirePermission('create_users'), createUser);
router.put('/:id', requirePermission('edit_users'), updateUser);
router.delete('/:id', requirePermission('delete_users'), deleteUser);
router.patch('/:id/password', updatePassword);

export default router;
