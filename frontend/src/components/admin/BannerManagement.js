import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    position: 'hero',
    status: 'active',
    sort_order: 0,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/cms/banners', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingBanner) {
        await axios.put(`http://localhost:5000/api/cms/banners/${editingBanner.id}`, formData, config);
      } else {
        await axios.post('http://localhost:5000/api/cms/banners', formData, config);
      }

      fetchBanners();
      resetForm();
      alert('Banner berhasil disimpan!');
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Gagal menyimpan banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      position: banner.position,
      status: banner.status,
      sort_order: banner.sort_order,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus banner ini?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`http://localhost:5000/api/cms/banners/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchBanners();
        alert('Banner berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting banner:', error);
        alert('Gagal menghapus banner');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      position: 'hero',
      status: 'active',
      sort_order: 0,
      start_date: '',
      end_date: ''
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Manajemen Banner</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Tambah Banner
            </button>
          </div>

          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>{editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Judul Banner</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Posisi</label>
                        <select
                          className="form-control"
                          value={formData.position}
                          onChange={(e) => setFormData({...formData, position: e.target.value})}
                        >
                          <option value="hero">Hero</option>
                          <option value="sidebar">Sidebar</option>
                          <option value="footer">Footer</option>
                          <option value="popup">Popup</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Deskripsi</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">URL Gambar</label>
                        <input
                          type="url"
                          className="form-control"
                          value={formData.image_url}
                          onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">URL Link</label>
                        <input
                          type="url"
                          className="form-control"
                          value={formData.link_url}
                          onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-control"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Tidak Aktif</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Urutan</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Tanggal Mulai</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.start_date}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Tanggal Berakhir</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.end_date}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success">
                      {editingBanner ? 'Update' : 'Simpan'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Judul</th>
                      <th>Posisi</th>
                      <th>Status</th>
                      <th>Urutan</th>
                      <th>Tanggal Mulai</th>
                      <th>Tanggal Berakhir</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map(banner => (
                      <tr key={banner.id}>
                        <td>{banner.id}</td>
                        <td>{banner.title}</td>
                        <td>
                          <span className={`badge bg-${banner.position === 'hero' ? 'primary' : 'secondary'}`}>
                            {banner.position}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${banner.status === 'active' ? 'success' : 'danger'}`}>
                            {banner.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td>{banner.sort_order}</td>
                        <td>{banner.start_date ? new Date(banner.start_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td>{banner.end_date ? new Date(banner.end_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(banner)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(banner.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerManagement;