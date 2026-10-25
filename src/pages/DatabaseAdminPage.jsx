// import { useState, useEffect } from 'react';
// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// export default function DatabaseAdmin() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [loginForm, setLoginForm] = useState({ email: '', password: '' });
//   const [activeTable, setActiveTable] = useState('landlords');
//   const [data, setData] = useState([]);
//   const [formData, setFormData] = useState({});
//   const [editingId, setEditingId] = useState(null);
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);

//   const tables = [
//     { name: 'landlords', label: 'Landlords' },
//     { name: 'houses', label: 'Houses' },
//     { name: 'bookings', label: 'Bookings' },
//     { name: 'security_logs', label: 'Security Logs' }
//   ];

//   // Check if already logged in
//   useEffect(() => {
//     const token = localStorage.getItem('dbAdminToken');
//     if (token) setIsLoggedIn(true);
//   }, []);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post(`${API_URL}/api/db-admin/login`, loginForm);
//       localStorage.setItem('dbAdminToken', response.data.token);
//       localStorage.setItem('dbAdminUser', JSON.stringify(response.data.user));
//       setIsLoggedIn(true);
//       setMessage('');
//     } catch (error) {
//       setMessage('Invalid credentials');
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('dbAdminToken');
//     localStorage.removeItem('dbAdminUser');
//     setIsLoggedIn(false);
//     setData([]);
//   };

//   const fetchData = async (table) => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('dbAdminToken');
//       const response = await axios.get(`${API_URL}/api/db-admin/${table}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setData(response.data);
//       setMessage('');
//     } catch (error) {
//       setMessage('Failed to fetch data: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (isLoggedIn) fetchData(activeTable);
//   }, [isLoggedIn, activeTable]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const token = localStorage.getItem('dbAdminToken');
      
//       if (editingId) {
//         await axios.put(`${API_URL}/api/db-admin/${activeTable}/${editingId}`, formData, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setMessage('Updated successfully');
//       } else {
//         await axios.post(`${API_URL}/api/db-admin/${activeTable}`, formData, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setMessage('Created successfully');
//       }
      
//       setFormData({});
//       setEditingId(null);
//       fetchData(activeTable);
//     } catch (error) {
//       setMessage('Operation failed: ' + error.message);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm('Are you sure you want to delete this record?')) return;
//     try {
//       const token = localStorage.getItem('dbAdminToken');
//       await axios.delete(`${API_URL}/api/db-admin/${activeTable}/${id}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setMessage('Deleted successfully');
//       fetchData(activeTable);
//     } catch (error) {
//       setMessage('Delete failed: ' + error.message);
//     }
//   };

//   const handleEdit = (item) => {
//     setEditingId(item.id);
//     setFormData(item);
//   };

//   const getFormFields = () => {
//     switch (activeTable) {
//       case 'landlords':
//         return [
//           { name: 'name', label: 'Name', type: 'text', required: true },
//           { name: 'email', label: 'Email', type: 'email', required: true },
//           { name: 'password_hash', label: 'Password Hash', type: 'text' },
//           { name: 'phone', label: 'Phone', type: 'text' },
//           { name: 'is_default_account', label: 'Is Default Account', type: 'number' },
//           { name: 'password_changed', label: 'Password Changed', type: 'number' }
//         ];
//       case 'houses':
//         return [
//           { name: 'id', label: 'ID (house-xxx)', type: 'text', required: true },
//           { name: 'landlord_id', label: 'Landlord ID', type: 'number', required: true },
//           { name: 'title', label: 'Title', type: 'text', required: true },
//           { name: 'estate', label: 'Estate', type: 'text' },
//           { name: 'type', label: 'Type', type: 'text' },
//           { name: 'rent', label: 'Rent', type: 'number' },
//           { name: 'deposit', label: 'Deposit', type: 'number' },
//           { name: 'status', label: 'Status', type: 'text' },
//           { name: 'rooms', label: 'Rooms', type: 'number' },
//           { name: 'bathrooms', label: 'Bathrooms', type: 'number' },
//           { name: 'description', label: 'Description', type: 'text' },
//           { name: 'phone', label: 'Phone', type: 'text' },
//           { name: 'image', label: 'Image URL', type: 'text' }
//         ];
//       case 'bookings':
//         return [
//           { name: 'id', label: 'ID (booking-xxx)', type: 'text', required: true },
//           { name: 'house_id', label: 'House ID', type: 'text', required: true },
//           { name: 'name', label: 'Name', type: 'text', required: true },
//           { name: 'email', label: 'Email', type: 'email' },
//           { name: 'phone', label: 'Phone', type: 'text', required: true },
//           { name: 'preferred_date', label: 'Preferred Date', type: 'date' },
//           { name: 'preferred_time', label: 'Preferred Time', type: 'text' },
//           { name: 'message', label: 'Message', type: 'text' },
//           { name: 'status', label: 'Status', type: 'text' }
//         ];
//       case 'security_logs':
//         return [
//           { name: 'landlord_id', label: 'Landlord ID', type: 'number' },
//           { name: 'action', label: 'Action', type: 'text', required: true },
//           { name: 'ip_address', label: 'IP Address', type: 'text' },
//           { name: 'success', label: 'Success (1/0)', type: 'number' },
//           { name: 'details', label: 'Details', type: 'text' }
//         ];
//       default:
//         return [];
//     }
//   };

//   if (!isLoggedIn) {
//     return (
//       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
//         <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '400px' }}>
//           <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Database Admin Login</h2>
//           <form onSubmit={handleLogin}>
//             <div style={{ marginBottom: '15px' }}>
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={loginForm.email}
//                 onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
//                 style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
//                 required
//               />
//             </div>
//             <div style={{ marginBottom: '20px' }}>
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={loginForm.password}
//                 onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
//                 style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
//                 required
//               />
//             </div>
//             <button type="submit" style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
//               Login
//             </button>
//           </form>
//           {message && <p style={{ color: '#dc3545', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
//           <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
//             Default: database@embu.com / database123
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
//         <h1 style={{ margin: 0, color: '#333' }}>Database Management Dashboard</h1>
//         <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
//           Logout
//         </button>
//       </div>

//       {/* Table Tabs */}
//       <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
//         {tables.map(table => (
//           <button
//             key={table.name}
//             onClick={() => { setActiveTable(table.name); setEditingId(null); setFormData({}); }}
//             style={{
//               padding: '12px 24px',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: 'pointer',
//               background: activeTable === table.name ? '#007bff' : '#f0f0f0',
//               color: activeTable === table.name ? 'white' : '#333',
//               fontSize: '14px'
//             }}
//           >
//             {table.label}
//           </button>
//         ))}
//       </div>

//       {message && (
//         <div style={{ padding: '12px', background: message.includes('failed') ? '#f8d7da' : '#d4edda', color: message.includes('failed') ? '#721c24' : '#155724', borderRadius: '4px', marginBottom: '20px' }}>
//           {message}
//         </div>
//       )}

//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
//         {/* Form Section */}
//         <div style={{ background: '#f9f9f9', padding: '25px', borderRadius: '8px' }}>
//           <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
//             {editingId ? 'Edit' : 'Create New'} {tables.find(t => t.name === activeTable)?.label}
//           </h3>
//           <form onSubmit={handleSubmit}>
//             {getFormFields().map(field => (
//               <div key={field.name} style={{ marginBottom: '15px' }}>
//                 <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
//                   {field.label}
//                 </label>
//                 <input
//                   type={field.type}
//                   value={formData[field.name] || ''}
//                   onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
//                   style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
//                   required={field.required}
//                 />
//               </div>
//             ))}
//             <div style={{ display: 'flex', gap: '10px' }}>
//               <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
//                 {editingId ? 'Update' : 'Create'}
//               </button>
//               {editingId && (
//                 <button type="button" onClick={() => {setEditingId(null); setFormData({});}} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
//                   Cancel
//                 </button>
//               )}
//             </div>
//           </form>
//         </div>

//         {/* Data Table */}
//         <div>
//           <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
//             All {tables.find(t => t.name === activeTable)?.label}
//           </h3>
//           {loading ? (
//             <p>Loading...</p>
//           ) : (
//             <div style={{ overflowX: 'auto' }}>
//               <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
//                 <thead>
//                   <tr style={{ background: '#007bff', color: 'white' }}>
//                     <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
//                     {activeTable === 'landlords' && <><th style={{ padding: '12px', textAlign: 'left' }}>Name</th><th style={{ padding: '12px', textAlign: 'left' }}>Email</th></>}
//                     {activeTable === 'houses' && <><th style={{ padding: '12px', textAlign: 'left' }}>Title</th><th style={{ padding: '12px', textAlign: 'left' }}>Estate</th><th style={{ padding: '12px', textAlign: 'left' }}>Rent</th></>}
//                     {activeTable === 'bookings' && <><th style={{ padding: '12px', textAlign: 'left' }}>Name</th><th style={{ padding: '12px', textAlign: 'left' }}>Status</th></>}
//                     {activeTable === 'security_logs' && <><th style={{ padding: '12px', textAlign: 'left' }}>Action</th><th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th><th style={{ padding: '12px', textAlign: 'left' }}>Date</th></>}
//                     <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {data.map(item => (
//                     <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
//                       <td style={{ padding: '12px' }}>{item.id}</td>
//                       {activeTable === 'landlords' && <><td style={{ padding: '12px' }}>{item.name}</td><td style={{ padding: '12px' }}>{item.email}</td></>}
//                       {activeTable === 'houses' && <><td style={{ padding: '12px' }}>{item.title}</td><td style={{ padding: '12px' }}>{item.estate}</td><td style={{ padding: '12px' }}>{item.rent}</td></>}
//                       {activeTable === 'bookings' && <><td style={{ padding: '12px' }}>{item.name}</td><td style={{ padding: '12px' }}>{item.status}</td></>}
//                       {activeTable === 'security_logs' && <><td style={{ padding: '12px' }}>{item.action}</td><td style={{ padding: '12px' }}>{item.ip_address || 'N/A'}</td><td style={{ padding: '12px' }}>{item.created_at}</td></>}
//                       <td style={{ padding: '12px' }}>
//                         <button onClick={() => handleEdit(item)} style={{ padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>
//                           Edit
//                         </button>
//                         <button onClick={() => handleDelete(item.id)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }