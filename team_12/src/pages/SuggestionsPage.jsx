import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const SuggestionsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchRecord();
  }, [id]);
  
  const fetchRecord = async () => {
    try {
      const response = await api.get(`/predict/${id}`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      toast.error('Failed to load record');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddSuggestion = () => {
    if (newSuggestion.trim()) {
      setSuggestions([...suggestions, newSuggestion.trim()]);
      setNewSuggestion('');
    }
  };
  
  const handleRemoveSuggestion = (index) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };
  
  const handleSave = async () => {
    try {
      await api.put(`/predict/${id}/suggestions`, { suggestions });
      toast.success('Suggestions updated successfully!');
      navigate(`/prediction/${id}`);
    } catch (error) {
      toast.error('Failed to update suggestions');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Suggestions</h1>
        
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Suggestions</h2>
          
          <div className="space-y-2 mb-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>{suggestion}</span>
                <button
                  onClick={() => handleRemoveSuggestion(index)}
                  className="text-red-600 hover:text-red-800 ml-4"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSuggestion()}
              placeholder="Add new suggestion..."
              className="input-field flex-1"
            />
            <button onClick={handleAddSuggestion} className="btn-primary">
              Add
            </button>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button onClick={handleSave} className="btn-primary">
            Save Changes
          </button>
          <button
            onClick={() => navigate(`/prediction/${id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsPage;


