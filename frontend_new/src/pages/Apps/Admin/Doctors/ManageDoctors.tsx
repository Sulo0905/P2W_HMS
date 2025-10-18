import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { IRootState } from '../../../../store';
import IconPlus from '../../../../components/Icon/IconPlus';
import Tippy from '@tippyjs/react';
import IconPencil from '../../../../components/Icon/IconPencil';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';
import { getAllDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../../../services/adminDoctor.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';

const ManageDoctors = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Doctors Management'));
    }, [dispatch]);

    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'firstName',
        direction: 'asc',
    });
    const [modal, setModal] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [recordsData, setRecordsData] = useState<any[]>([]);
    const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
    const [doctorToDelete, setDoctorToDelete] = useState<any | null>(null);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialization: '',
        username: '',
        password: '',
    });

    // Fetch all doctors
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await getAllDoctors();
                setDoctors(res);
                setInitialRecords(sortBy(res, 'firstName'));
            } catch (err) {
                console.error('Failed to fetch doctors', err);
            }
        };
        fetchDoctors();
    }, []);

    // Handle pagination
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    // Search + sort safely
    useEffect(() => {
        let filtered = doctors.filter((doc) => {
            const fullName = `${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim();
            const email = doc.email ?? '';
            const specialization = doc.specialization ?? '';
            return fullName.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase()) || specialization.toLowerCase().includes(search.toLowerCase());
        });

        const sorted = sortBy(filtered, sortStatus.columnAccessor as keyof any);
        const sortedData = sortStatus.direction === 'desc' ? sorted.reverse() : sorted;
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sortedData.slice(from, to));
    }, [doctors, page, pageSize, search, sortStatus]);

    // Add / Edit Doctor
    const handleSubmitDoctor = async () => {
        console.log('Submitting doctor form:', form);

        if (!form.firstName || !form.lastName || !form.email || !form.username || !form.specialization) {
            toast.warning(' Please fill in all required fields.');
            return;
        }

        try {
            const payload = {
                name: `${form.firstName} ${form.lastName}`,
                email: form.email,
                phone: form.phone,
                specialization: form.specialization,
                username: form.username,
                password: form.password,
            };

            if (editingDoctor) {
                const updated = await updateDoctor(editingDoctor._id, payload);
                const updatedList = doctors.map((doc) => (doc._id === editingDoctor._id ? updated : doc));
                setDoctors(updatedList);
                setInitialRecords(sortBy(updatedList, 'firstName'));
                toast.success('Doctor updated successfully!');
            } else {
                const newDoc = await createDoctor(payload);
                const updatedList = [...doctors, newDoc];
                setDoctors(updatedList);
                setInitialRecords(sortBy(updatedList, 'firstName'));
                toast.success('Doctor added successfully!');
            }

            // Reset form
            setForm({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                specialization: '',
                username: '',
                password: '',
            });
            setEditingDoctor(null);
            setModal(false);
        } catch (err: any) {
            console.error(' Failed to save doctor:', err);

            if (err.response && err.response.status === 400) {
                toast.error('Doctor already exists or invalid data.');
            } else if (err.response && err.response.status === 403) {
                toast.error('You are not authorized to perform this action.');
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        }
    };

    const handleConfirmDelete = async () => {
        if (!doctorToDelete) return;

        try {
            const res = await deleteDoctor(doctorToDelete._id);

            // ✅ Fix: Check for "message" instead of deletedDoctorId
            if (res?.message?.toLowerCase().includes('deleted')) {
                const filtered = doctors.filter((doc) => doc._id !== doctorToDelete._id);
                setDoctors(filtered);
                setInitialRecords(sortBy(filtered, 'firstName'));
                toast.success('Doctor deleted successfully!');
            } else {
                toast.warning('⚠️ Doctor deletion was not confirmed by server.');
                console.warn('Unexpected delete response:', res);
            }

            setDeleteModalOpen(false);
            setDoctorToDelete(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || '❌ Failed to delete doctor. Please try again.');
            console.error('Delete error:', err);
        }
    };

    // Download PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Doctors List', 14, 22);

        // Table rows
        const rows = doctors.map((d, idx) => [idx + 1, `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(), d.email ?? '', d.phone ?? '', d.specialization ?? '']);

        autoTable(doc, {
            head: [['#', 'Name', 'Email', 'Phone', 'Specialization']],
            body: rows,
            startY: 30,
        });

        doc.save('doctors-list.pdf');
    };

    return (
        <div>
            {/* Add/Edit Doctor Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="panel w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg">
                        <h5 className="text-lg font-semibold mb-4">{editingDoctor ? 'Edit Doctor' : 'Add Doctor'}</h5>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="First Name" className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                                <input type="text" placeholder="Last Name" className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                            </div>
                            <input type="email" placeholder="Email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            <input type="text" placeholder="Phone" className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            <select className="form-input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}>
                                <option value="">Select Specialization</option>
                                <option value="ENT">ENT</option>
                                <option value="Obstetrics">Obstetrics</option>
                                <option value="General">General</option>
                                <option value="Other">Other</option>
                            </select>

                            <input type="text" placeholder="Username" className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                            <input type="password" placeholder="Password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => {
                                    setModal(false);
                                    setEditingDoctor(null);
                                    setForm({ firstName: '', lastName: '', email: '', phone: '', specialization: '', username: '', password: '' });
                                }}
                            >
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSubmitDoctor}>
                                {editingDoctor ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="panel w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg">
                        <h5 className="text-lg font-semibold mb-4">Confirm Delete</h5>
                        <p className="mb-6">Are you sure you want to delete this doctor?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setDoctorToDelete(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <button onClick={() => setModal(true)} className="btn btn-primary btn-sm">
                        <IconPlus className="mr-2" />
                        Add Doctor
                    </button>

                    <button onClick={handleDownloadPDF} className="btn btn-secondary btn-sm">
                        Download PDF
                    </button>

                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: '_id', title: '#', render: (_, idx) => idx + 1 },
                            { accessor: 'firstName', title: 'Name', render: (row) => `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(), sortable: true },
                            { accessor: 'email', title: 'Email', sortable: true },
                            { accessor: 'phone', title: 'Phone' },
                            { accessor: 'specialization', title: 'Specialization', sortable: true },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex items-center w-max mx-auto gap-2">
                                        <Tippy content="Edit" key={`edit-${row._id}`}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingDoctor(row);
                                                    setForm({
                                                        firstName: row.firstName ?? '',
                                                        lastName: row.lastName ?? '',
                                                        email: row.email ?? '',
                                                        phone: row.phone ?? '',
                                                        specialization: row.specialization ?? '',
                                                        username: row.username ?? '',
                                                        password: '',
                                                    });
                                                    setModal(true);
                                                }}
                                            >
                                                <IconPencil />
                                            </button>
                                        </Tippy>
                                        <Tippy content="Delete" key={`delete-${row._id}`}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDoctorToDelete(row);
                                                    setDeleteModalOpen(true);
                                                }}
                                            >
                                                <IconTrashLines />
                                            </button>
                                        </Tippy>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={setPage}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </div>
    );
};

export default ManageDoctors;
