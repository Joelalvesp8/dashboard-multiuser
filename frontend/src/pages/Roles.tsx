import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../services/api';
import type { Role, Permission } from '../types';

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        adminAPI.getAllRoles(),
        adminAPI.getAllPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const handleEdit = async (role: Role) => {
    try {
      const roleDetails = await adminAPI.getRoleById(role.id);
      setEditingRole(roleDetails);
      setFormData({
        name: roleDetails.name,
        description: roleDetails.description || '',
        permissions: roleDetails.permissions?.map((p) => p.id) || [],
      });
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao carregar role:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await adminAPI.updateRole(editingRole.id, formData);
      } else {
        await adminAPI.createRole(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar role');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta role?')) return;

    try {
      await adminAPI.deleteRole(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao deletar role');
    }
  };

  const togglePermission = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  // Agrupar permissões por recurso
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissões</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            + Nova Role
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Roles */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles</h2>
            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-primary-600 hover:text-primary-900 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Permissões */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissões Disponíveis</h2>
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-semibold text-gray-900 capitalize mb-2">{resource}</h3>
                  <div className="space-y-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <span className="font-mono text-primary-600">{permission.action}</span>
                        <span className="text-gray-600">- {permission.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingRole ? 'Editar Role' : 'Nova Role'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Descrição</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Permissões</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <div key={resource} className="mb-4">
                        <h4 className="font-semibold text-gray-700 capitalize mb-2">
                          {resource}
                        </h4>
                        <div className="space-y-2 ml-4">
                          {perms.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-start space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="mt-1"
                              />
                              <div className="text-sm">
                                <span className="font-medium">{permission.name}</span>
                                <p className="text-gray-600">{permission.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
