import React from 'react';
import { Settings } from 'lucide-react';

function SystemSettingsPage() {
    // Mock settings data
    const settings = {
        defaultRetentionPolicy: {
            type: "Finance Reports",
            period: "10 years",
        },
        awsServices: [
            { name: "S3 Bucket (documents)", status: "Connected", region: "eu-central-1" },
            { name: "RDS (PostgreSQL Metadata)", status: "Connected", region: "eu-central-1" },
            { name: "Cognito (Authentication)", status: "Connected", region: "eu-central-1" },
            { name: "SQS (Async Processing)", status: "Connected", region: "eu-central-1" },
            { name: "QLDB (Audit Log)", status: "Connected", region: "eu-central-1" },
            { name: "OpenSearch Service", status: "Connected", region: "eu-central-1" },
            { name: "Textract (OCR)", status: "Connected", region: "eu-central-1" },
            { name: "Comprehend (AI/PII)", status: "Connected", region: "eu-central-1" },
        ],
        apiGatewayEndpoint: "https://api.openarchive.example-hackathon.com/v1",
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center"><Settings className="mr-3 text-sky-600 h-8 w-8"/>System Settings</h2>
            <p className="text-slate-600 mb-8">Configure system parameters and view integration statuses (mocked).</p>
            
            <div className="space-y-8">
                {/* Default Retention Policies Section */}
                <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">Default Retention Policies</h3>
                    <p className="text-sm text-slate-600">
                        Example: Documents of type <span className="font-medium text-sky-700">"{settings.defaultRetentionPolicy.type}"</span> are set for a default retention of <span className="font-medium text-sky-700">{settings.defaultRetentionPolicy.period}</span>.
                    </p>
                    <button className="mt-3 text-sm bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 rounded-md shadow transition-colors">Configure Policies (Mock)</button>
                </div>

                {/* AWS Service Integration Status Section */}
                <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">AWS Service Integration Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {settings.awsServices.map(service => (
                            <div key={service.name} className="p-3 border border-slate-300 rounded-md bg-white">
                                <p className="font-medium text-slate-800">{service.name}</p>
                                <p className={`text-sm ${service.status === "Connected" ? "text-green-600" : "text-red-600"}`}>
                                    Status: {service.status}
                                </p>
                                <p className="text-xs text-slate-500">Region: {service.region}</p>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* API Gateway Endpoint Section */}
                <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">API Gateway Endpoint</h3>
                    <p className="text-sm text-slate-600">Main API endpoint for backend services:</p>
                    <p className="text-sm text-slate-800 font-mono bg-slate-200 p-2 rounded mt-1 inline-block">{settings.apiGatewayEndpoint}</p>
                </div>
            </div>
        </div>
    );
}

export default SystemSettingsPage;