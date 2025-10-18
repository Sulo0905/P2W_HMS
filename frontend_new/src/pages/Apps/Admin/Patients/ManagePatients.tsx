import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import { IRootState } from '../../../../store';
import { Dialog } from '@headlessui/react';
import Tippy from '@tippyjs/react';
import { IoClose } from 'react-icons/io5';
import IconPlus from '../../../../components/Icon/IconPlus';
import IconPencil from '../../../../components/Icon/IconPencil';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';

import { getAllPatients, createPatient, updatePatient, deletePatient } from '../../../../services/adminPatient.service';

const ManagePatients = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    useEffect(() => {
        dispatch(setPageTitle('Manage Patients'));
    }, [dispatch]);

    // Pagination and sorting
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'firstName',
        direction: 'asc',
    });

    // Data state
    const [patients, setPatients] = useState<any[]>([]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [recordsData, setRecordsData] = useState<any[]>([]);

    // Search
    const [search, setSearch] = useState('');

    // Modals and form state
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
    const [patientToDelete, setPatientToDelete] = useState<any | null>(null);

    // Patient form fields
    const [formData, setFormData] = useState<any>({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        gender: '',
        patientType: '',
        phone: '',
        password: '',
    });

    // Fetch patients
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await getAllPatients();
                const list = res.data || res;
                setPatients(list);
                setInitialRecords(sortBy(list, 'firstName'));
            } catch (err) {
                console.error('Failed to fetch patients', err);
            }
        };

        fetchPatients();
    }, []);

    // Handle pagination
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    // Handle sorting + search
    useEffect(() => {
        let filtered = patients.filter((p) => {
            const firstName = p.firstName?.toLowerCase() || '';
            const lastName = p.lastName?.toLowerCase() || '';
            const email = p.email?.toLowerCase() || '';
            return firstName.includes(search.toLowerCase()) || lastName.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
        });

        const sorted = sortBy(filtered, sortStatus.columnAccessor);
        const sortedData = sortStatus.direction === 'desc' ? sorted.reverse() : sorted;

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sortedData.slice(from, to));
    }, [patients, page, pageSize, search, sortStatus]);

    // Handle add/edit submit
    const handleSubmitPatient = async () => {
        if (!formData.firstName || !formData.email || !formData.username) return;

        try {
            if (editingPatientId) {
                // Update
                const updated = await updatePatient(editingPatientId, formData);
                const newList = patients.map((p) => (p._id === editingPatientId ? updated : p));
                setPatients(newList);
                setInitialRecords(sortBy(newList, 'firstName'));
            } else {
                // Create
                const newPatient = await createPatient(formData);
                const updatedList = [...patients, newPatient];
                setPatients(updatedList);
                setInitialRecords(sortBy(updatedList, 'firstName'));
            }

            // Reset
            setModalOpen(false);
            setFormData({
                username: '',
                email: '',
                firstName: '',
                lastName: '',
                gender: '',
                patientType: '',
                phone: '',
                password: '',
            });
            setEditingPatientId(null);
        } catch (err) {
            console.error('Failed to save patient', err);
        }
    };

    // Delete patient
    const handleConfirmDelete = async () => {
        if (!patientToDelete) return;
        try {
            await deletePatient(patientToDelete._id);
            const filtered = patients.filter((p) => p._id !== patientToDelete._id);
            setPatients(filtered);
            setInitialRecords(sortBy(filtered, 'firstName'));
            setDeleteModalOpen(false);
            setPatientToDelete(null);
        } catch (err) {
            console.error('Failed to delete patient', err);
        }
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
                        <IconPlus className="mr-2" />
                        Add Patient
                    </button>

                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                {/* ADD / EDIT MODAL */}
                <Dialog as="div" open={modalOpen} onClose={() => setModalOpen(false)} className="fixed inset-0 z-[999] bg-black/60">
                    <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">{editingPatientId ? 'Edit Patient' : 'Add Patient'}</h2>
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setEditingPatientId(null);
                                }}
                            >
                                <IoClose size={24} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="First Name"
                                className="form-input w-full"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                className="form-input w-full"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                className="form-input w-full"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <input type="email" placeholder="Email" className="form-input w-full" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            <input type="text" placeholder="Phone" className="form-input w-full" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            <select className="form-input w-full" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>

                            <select className="form-input w-full" value={formData.patientType} onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}>
                                <option value="">Select Patient Type</option>
                                <option value="ENT">ENT</option>
                                <option value="Obstetrics">Obstetrics</option>
                                <option value="General">General</option>
                                <option value="Other">Other</option>
                            </select>

                            {!editingPatientId && (
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="form-input w-full"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            )}
                        </div>

                        <div className="flex justify-end mt-5">
                            <button className="btn btn-primary" onClick={handleSubmitPatient}>
                                {editingPatientId ? 'Update' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </Dialog>

                {/* DELETE CONFIRM MODAL */}
                <Dialog as="div" open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="fixed inset-0 z-[999] bg-black/60">
                    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-white p-6 rounded shadow-lg">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Confirm Deletion</h2>
                            <p className="mt-2">
                                Are you sure you want to delete{' '}
                                <strong>
                                    {patientToDelete?.firstName} {patientToDelete?.lastName}
                                </strong>
                                ?
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button className="btn btn-outline-primary" onClick={() => setDeleteModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleConfirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </Dialog>

                {/* TABLE */}
                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: '_id', title: 'ID', sortable: true },
                            { accessor: 'firstName', title: 'First Name', sortable: true },
                            { accessor: 'lastName', title: 'Last Name', sortable: true },
                            { accessor: 'email', title: 'Email', sortable: true },
                            { accessor: 'phone', title: 'Phone', sortable: true },
                            { accessor: 'gender', title: 'Gender', sortable: true },
                            { accessor: 'patientType', title: 'Type', sortable: true },
                            {
                                accessor: 'action',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex items-center w-max mx-auto gap-2">
                                        <Tippy content="Edit">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({
                                                        ...row,
                                                        password: '',
                                                    });
                                                    setEditingPatientId(row._id);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                <IconPencil />
                                            </button>
                                        </Tippy>
                                        <Tippy content="Delete">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPatientToDelete(row);
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

export default ManagePatients;
