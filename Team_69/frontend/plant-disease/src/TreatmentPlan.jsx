import React, { useState, useEffect } from 'react';
import { getTreatmentPlan } from './treatmentData';
import './TreatmentPlan.css';

const TreatmentPlan = ({ diseaseName, mongoData }) => {
    const [treatmentData, setTreatmentData] = useState(null);
    const [activeTab, setActiveTab] = useState('organic');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (diseaseName) {
            setLoading(true);
            const data = getTreatmentPlan(diseaseName);
            setTreatmentData(data);
            setLoading(false);
        }
    }, [diseaseName]);

    if (loading) {
        return (
            <div className="treatment-loading">
                <p>Loading treatment information...</p>
            </div>
        );
    }

    if (!treatmentData) {
        return (
            <div className="no-treatment">
                <h3>⚠️ Treatment Plan Not Available</h3>
                <p>We don't have a treatment plan for "{diseaseName}" yet.</p>
                <p>Please consult with a local agricultural expert.</p>
            </div>
        );
    }

    const getSeverityClass = (severity) => {
        const severityLower = severity.toLowerCase();
        if (severityLower.includes('very high') || severityLower.includes('urgent')) {
            return 'very-high';
        } else if (severityLower.includes('high')) {
            return 'high';
        } else if (severityLower.includes('medium')) {
            return 'medium';
        }
        return 'low';
    };

    const currentTreatment = activeTab === 'organic'
        ? treatmentData.organicTreatment
        : treatmentData.chemicalTreatment;

    return (
        <div className="treatment-plan-container">
            {/* Header */}
            <div className="treatment-header">
                <h2 className="treatment-title">
                    🌿 Treatment Plan: {treatmentData.diseaseName}
                </h2>
                <span className={`severity-badge ${getSeverityClass(treatmentData.severity)}`}>
                    {treatmentData.severity}
                </span>
                <p className="treatment-description">
                    {treatmentData.description}
                </p>
            </div>

            {/* MongoDB Database Info - Highlighted Section */}
            {mongoData && mongoData.causeause && (
                <div className="mongo-data-section">
                    <h3 className="section-title">
                        <span className="section-icon">💾</span>
                        Database Information
                    </h3>
                    <div className="mongo-content">
                        {mongoData.causeause && (
                            <div className="mongo-item">
                                <strong>Causes:</strong>
                                <p>{mongoData.causeause}</p>
                            </div>
                        )}
                        {mongoData.prevention && (
                            <div className="mongo-item">
                                <strong>Prevention:</strong>
                                <p>{mongoData.prevention}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Symptoms Section */}
            <div className="symptoms-section">
                <h3 className="section-title">
                    <span className="section-icon">🔍</span>
                    Symptoms to Watch For
                </h3>
                <ul className="symptoms-list">
                    {treatmentData.symptoms.map((symptom, index) => (
                        <li key={index}>{symptom}</li>
                    ))}
                </ul>
            </div>

            {/* Treatment Tabs */}
            <div className="treatment-tabs">
                <button
                    className={`tab-button organic ${activeTab === 'organic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('organic')}
                >
                    🌱 Organic Treatment
                </button>
                <button
                    className={`tab-button chemical ${activeTab === 'chemical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chemical')}
                >
                    🧪 Chemical Treatment
                </button>
            </div>

            {/* Treatment Content */}
            <div className="treatment-content">
                <h3 className="section-title">
                    {activeTab === 'organic' ? '🌱' : '🧪'} {currentTreatment.title}
                </h3>

                <div className="treatment-steps">
                    <h4>Step-by-Step Instructions:</h4>
                    <ol className="steps-list">
                        {currentTreatment.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                        ))}
                    </ol>
                </div>

                {/* Marketplace - Product Recommendations */}
                <div className="marketplace-section">
                    <h3 className="section-title">
                        <span className="section-icon">🛒</span>
                        Recommended Products
                    </h3>
                    <div className="products-grid">
                        {currentTreatment.products.map((product, index) => (
                            <div key={index} className="product-card">
                                <h4 className="product-name">{product.name}</h4>
                                <p className="product-description">{product.description}</p>
                                <div className="product-price">{product.price}</div>
                                <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="product-link"
                                >
                                    Buy on Amazon
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Prevention Section */}
            <div className="prevention-section">
                <h3 className="section-title">
                    <span className="section-icon">🛡️</span>
                    Prevention & Best Practices
                </h3>
                <ul className="prevention-list">
                    {treatmentData.prevention.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TreatmentPlan;
