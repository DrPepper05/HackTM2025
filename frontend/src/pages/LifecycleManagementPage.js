import React, { useState } from 'react';
import { FileClock, FilePlus } from 'lucide-react';

function LifecycleManagementPage() {
    const [tasks, setTasks] = useState([
        {id: 'task1', description: 'Review documents older than 10 years in "Finance" category for potential transfer', status: 'Pending', dueDate: '2024-06-30'},
        {id: 'task2', description: 'Prepare EAD export for "Historical Records 1950-1960" (mock action)', status: 'In Progress', assignedTo: 'Archivist User 1'},
        {id: 'task3', description: 'Confirm destruction of documents batch #DESTR001 (mock action)', status: 'Completed', completionDate: '2024-05-15'},
    ]);

    // Mock function to handle task actions
    const handleTaskAction = (taskId, taskStatus) => {
        console.log(`Performing action for task ${taskId}, current status: ${taskStatus}`);
        // Here you would typically call an API or update global state
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center"><FileClock className="mr-3 text-sky-600 h-8 w-8"/>Lifecycle Management</h2>
            <p className="text-slate-600 mb-6">Oversee document retention schedules, review periods, transfers, and destructions (mocked functionalities).</p>
            
            <div className="space-y-4">
                {tasks.map(task => (
                    <div key={task.id} className="p-4 border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-700">{task.description}</h3>
                                <p className="text-sm text-slate-500">
                                    Status: <span className={`font-medium ${task.status === 'Completed' ? 'text-green-600' : task.status === 'In Progress' ? 'text-blue-600' : 'text-amber-600'}`}>{task.status}</span>
                                    {task.dueDate && ` | Due: ${task.dueDate}`}
                                    {task.assignedTo && ` | Assigned: ${task.assignedTo}`}
                                    {task.completionDate && ` | Completed: ${task.completionDate}`}
                                </p>
                            </div>
                            <button 
                                onClick={() => handleTaskAction(task.id, task.status)}
                                className="text-sm bg-sky-500 hover:bg-sky-600 text-white py-1 px-3 rounded-md shadow transition-colors"
                            >
                                {task.status === 'Pending' ? 'Start Task' : 'View Details'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-8">
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center">
                    <FilePlus className="mr-2 h-5 w-5" /> Create New Lifecycle Rule/Task (Mock)
                </button>
            </div>
        </div>
    );
}

export default LifecycleManagementPage;