import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    sort_order: 0,
    status: 'active'
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const response = await axios.get('https://4171-103-84-209-89.ngrok-free.app/api/cms/faqs');
      setFaqs(response.data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingFaq) {
        await axios.put(`https://4171-103-84-209-89.ngrok-free.app/api/cms/faqs/${editingFaq.id}`, formData, config);
      } else {
        await axios.post('https://4171-103-84-209-89.ngrok-free.app/api/cms/faqs', formData, config);
      }

      fetchFaqs();
      resetForm();
      alert('FAQ berhasil disimpan!');
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Gagal menyimpan FAQ');
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      sort_order: faq.sort_order,
      status: faq.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`https://4171-103-84-209-89.ngrok-free.app/api/cms/faqs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchFaqs();
        alert('FAQ berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        alert('Gagal menghapus FAQ');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      sort_order: 0,
      status: 'active'
    });
    setEditingFaq(null);
    setShowForm(false);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Manajemen FAQ</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Tambah FAQ
            </button>
          </div>

          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>{editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label className="form-label">Pertanyaan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.question}
                          onChange={(e) => setFormData({...formData, question: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Kategori</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          placeholder="Contoh: Pembayaran, Produk, dll"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Jawaban</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={formData.answer}
                      onChange={(e) => setFormData({...formData, answer: e.target.value})}
                      required
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
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
                    <div className="col-md-6">
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
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success">
                      {editingFaq ? 'Update' : 'Simpan'}
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
                      <th>Pertanyaan</th>
                      <th>Kategori</th>
                      <th>Status</th>
                      <th>Urutan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map(faq => (
                      <tr key={faq.id}>
                        <td>{faq.id}</td>
                        <td>{faq.question.length > 50 ? faq.question.substring(0, 50) + '...' : faq.question}</td>
                        <td>
                          {faq.category && (
                            <span className="badge bg-info">{faq.category}</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge bg-${faq.status === 'active' ? 'success' : 'danger'}`}>
                            {faq.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td>{faq.sort_order}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(faq)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(faq.id)}
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

export default FAQManagement;