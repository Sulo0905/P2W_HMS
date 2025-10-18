import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { IRootState } from '../../../store';
import { getAllAppointments } from '../../../services/appointments.service';

const ViewAppointments = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    useEffect(() => {
        dispatch(setPageTitle('View Appointments'));
    }, [dispatch]);

    // Pagination setup
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'appointmentDate',
        direction: 'asc',
    });

    // Data
    const [appointments, setAppointments] = useState<any[]>([]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [recordsData, setRecordsData] = useState<any[]>([]);

    // Search
    const [search, setSearch] = useState('');

    // Fetch appointments
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await getAllAppointments();
                const list = res.data || res;
                setAppointments(list);
                setInitialRecords(sortBy(list, 'appointmentDate'));
            } catch (err) {
                console.error('Failed to fetch appointments', err);
            }
        };

        fetchAppointments();
    }, []);

    // Pagination
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    // Sorting + search
    useEffect(() => {
        let filtered = appointments.filter((a) => {
            const doctorName = `${a.doctor?.firstName || ''} ${a.doctor?.lastName || ''}`.toLowerCase();
            const patientName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
            const status = a.status?.toLowerCase() || '';
            const date = a.appointmentDate || '';

            return doctorName.includes(search.toLowerCase()) || patientName.includes(search.toLowerCase()) || status.includes(search.toLowerCase()) || date.includes(search);
        });

        const sorted = sortBy(filtered, sortStatus.columnAccessor);
        const sortedData = sortStatus.direction === 'desc' ? sorted.reverse() : sorted;

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sortedData.slice(from, to));
    }, [appointments, page, pageSize, search, sortStatus]);

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <h2 className="text-lg font-semibold">All Appointments</h2>

                    <input type="text" className="form-input w-auto" placeholder="Search by doctor, patient, status..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: '_id', title: 'ID', sortable: true },
                            {
                                accessor: 'doctorName',
                                title: 'Doctor',
                                sortable: true,
                                render: (row) => `${row.doctor?.firstName || ''} ${row.doctor?.lastName || ''}`,
                            },
                            {
                                accessor: 'patientName',
                                title: 'Patient',
                                sortable: true,
                                render: (row) => `${row.patient?.firstName || ''} ${row.patient?.lastName || ''}`,
                            },
                            {
                                accessor: 'appointmentDate',
                                title: 'Date',
                                sortable: true,
                                render: (row) => new Date(row.appointmentDate).toLocaleDateString(),
                            },
                            {
                                accessor: 'appointmentTime',
                                title: 'Time',
                                sortable: true,
                                render: (row) => row.appointmentTime || '—',
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                sortable: true,
                                render: (row) => (
                                    <span
                                        className={`badge ${row.status === 'Completed' ? 'bg-green-500 text-white' : row.status === 'Cancelled' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                                    >
                                        {row.status}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'notes',
                                title: 'Notes',
                                render: (row) => row.notes || '—',
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

export default ViewAppointments;
