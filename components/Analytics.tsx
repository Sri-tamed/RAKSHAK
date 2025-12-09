import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

const data = [
  { name: 'Mon', success: 85, accuracy: 92 },
  { name: 'Tue', success: 88, accuracy: 89 },
  { name: 'Wed', success: 95, accuracy: 96 },
  { name: 'Thu', success: 90, accuracy: 91 },
  { name: 'Fri', success: 98, accuracy: 99 },
];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-ui-panel p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">TOTAL MISSIONS</h3>
            <div className="text-3xl font-bold text-white">124</div>
            <div className="text-xs text-green-400">+12% this week</div>
        </div>
        <div className="bg-ui-panel p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">LIVES IMPACTED</h3>
            <div className="text-3xl font-bold text-white">450+</div>
            <div className="text-xs text-india-saffron">Critical supplies delivered</div>
        </div>
        <div className="bg-ui-panel p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">AVG RESPONSE TIME</h3>
            <div className="text-3xl font-bold text-white">8m 42s</div>
            <div className="text-xs text-blue-400">-30s improvement</div>
        </div>
      </div>

      <div className="bg-ui-panel p-4 rounded-lg border border-gray-700 h-64">
        <h3 className="text-white font-medium mb-4">Mission Success Rate & Drop Accuracy</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} 
            />
            <Line type="monotone" dataKey="success" stroke="#138808" strokeWidth={2} name="Success Rate" />
            <Line type="monotone" dataKey="accuracy" stroke="#FF9933" strokeWidth={2} name="Drop Accuracy" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
