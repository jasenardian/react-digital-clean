import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContentEditor = () => {
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [formData, setFormData] = useState({
    content: '',
    content_type: 'html'
  });

  const predefinedContents = [
    { key: 'terms_conditions', label: 'Syarat & Ketentuan' },
    { key: 'privacy_policy', label: 'Kebijakan Privasi' },
    { key: 'about_us', label: 'Tentang Kami' },
    { key: 'contact_info', label: 'Informasi Kontak' },
    { key: 'help_guide', label: 'Panduan Bantuan' }
  ];

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await axios.get('https://4171-103-84-209-89.ngrok-free.app/api/cms/content');
      setContents(response.data);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const handleContentSelect = async (key) => {
    try {
      const response = await axios.get(`https://4171-103-84-209-89.ngrok-free.app/api/cms/content/${key}`);
      setSelectedContent(key);
      setFormData({
        content: response.data.content || '',
        content_type: response.data.content_type || 'html'
      });
    } catch (error) {
      // If content doesn't exist, create empty form
      setSelectedContent(key);
      setFormData({
        content: '',
        content_type: 'html'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`https://4171-103-84-209-89.ngrok-free.app/api/cms/content/${selectedContent}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchContents();
      alert('Konten berhasil disimpan!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Gagal menyimpan konten');
    }
  };

  const getContentLabel = (key) => {
    const predefined = predefinedContents.find(item => item.key === key);
    return predefined ? predefined.label : key;
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3">
          <div className="card">
            <div className="card-header">
              <h5>Pilih Konten</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {predefinedContents.map(item => (
                  <button
                    key={item.key}
                    className={`list-group-item list-group-item-action ${
                      selectedContent === item.key ? 'active' : ''
                    }`}
                    onClick={() => handleContentSelect(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          {selectedContent ? (
            <div className="card">
              <div className="card-header">
                <h5>Edit: {getContentLabel(selectedContent)}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Tipe Konten</label>
                    <select
                      className="form-control"
                      value={formData.content_type}
                      onChange={(e) => setFormData({...formData, content_type: e.target.value})}
                    >
                      <option value="html">HTML</option>
                      <option value="text">Text</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Konten</label>
                    <textarea
                      className="form-control"
                      rows="15"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="Masukkan konten di sini..."
                      style={{ fontFamily: 'monospace' }}
                    ></textarea>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success">
                      Simpan Konten
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setSelectedContent(null)}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center">
                <h5>Pilih konten yang ingin diedit</h5>
                <p className="text-muted">Pilih salah satu konten dari menu di sebelah kiri untuk mulai mengedit.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;