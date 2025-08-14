import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronUpIcon, ChevronDownIcon, Download, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Child {
  id: string;
  first_name: string;
}

interface DoseLog {
  id: string;
  medication_name: string;
  child_name: string;
  amount_given: number;
  unit: string;
  given_datetime: string;
  was_given: boolean;
  is_prn: boolean;
  reason_given?: string;
  reason_not_given?: string;
  notes?: string;
  due_datetime?: string; // Original scheduled time from dose_instances
}

type SortField = 'given_datetime' | 'medication_name' | 'child_name' | 'amount_given';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const History = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [children, setChildren] = useState<Child[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<DoseLog[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('given_datetime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [dataLoading, setDataLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      
      // Fetch children
      const { data: childrenData } = await supabase
        .from('children')
        .select('id, first_name')
        .order('first_name');
      
      if (childrenData) setChildren(childrenData);

      // Fetch dose logs with medication and child names, including due_datetime from dose_instances
      const { data: logsData } = await supabase
        .from('dose_logs')
        .select(`
          id,
          amount_given,
          unit,
          given_datetime,
          was_given,
          is_prn,
          reason_given,
          reason_not_given,
          notes,
          dose_instance_id,
          medications!inner(name, child_id),
          children!inner(first_name)
        `)
        .order('given_datetime', { ascending: false });

      if (logsData) {
        // Get unique dose instance IDs for fetching due times
        const doseInstanceIds = logsData
          .map(log => log.dose_instance_id)
          .filter(id => id !== null);

        // Fetch due times for dose instances
        let doseInstancesMap: Record<string, string> = {};
        if (doseInstanceIds.length > 0) {
          const { data: doseInstancesData } = await supabase
            .from('dose_instances')
            .select('id, due_datetime')
            .in('id', doseInstanceIds);

          if (doseInstancesData) {
            doseInstancesMap = doseInstancesData.reduce((acc, instance) => {
              acc[instance.id] = instance.due_datetime;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        const formattedLogs: DoseLog[] = logsData.map((log: any) => ({
          id: log.id,
          medication_name: log.medications.name,
          child_name: log.children.first_name,
          amount_given: log.amount_given,
          unit: log.unit,
          given_datetime: log.given_datetime,
          was_given: log.was_given,
          is_prn: log.is_prn,
          reason_given: log.reason_given,
          reason_not_given: log.reason_not_given,
          notes: log.notes,
          due_datetime: log.dose_instance_id ? doseInstancesMap[log.dose_instance_id] || null : null,
        }));
        setDoseLogs(formattedLogs);
        setFilteredLogs(formattedLogs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dose history",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  // Generate month/year options
  const getMonthYearOptions = () => {
    const months = [
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return { months, years };
  };

  const { months, years } = getMonthYearOptions();

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...doseLogs];

    // Filter by child
    if (selectedChild !== 'all') {
      const childName = children.find(c => c.id === selectedChild)?.first_name;
      if (childName) {
        filtered = filtered.filter(log => log.child_name === childName);
      }
    }

    // Filter by month/year
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.given_datetime);
        const monthMatch = selectedMonth === 'all' || logDate.getMonth() + 1 === parseInt(selectedMonth);
        const yearMatch = selectedYear === 'all' || logDate.getFullYear() === parseInt(selectedYear);
        return monthMatch && yearMatch;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'given_datetime') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [doseLogs, selectedChild, selectedMonth, selectedYear, sortField, sortDirection, children]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />;
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const scheduledLogs = currentLogs.filter(log => !log.is_prn);
  const prnLogs = currentLogs.filter(log => log.is_prn);

  // PDF Export
  const exportToPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Medication Dose History', 20, 20);
      
      // Filters info
      doc.setFontSize(12);
      let y = 35;
      const childName = selectedChild === 'all' ? 'All Children' : children.find(c => c.id === selectedChild)?.first_name || 'Unknown';
      const monthName = selectedMonth === 'all' ? 'All Months' : months.find(m => m.value === selectedMonth)?.label || 'Unknown';
      const yearName = selectedYear === 'all' ? 'All Years' : selectedYear;
      
      doc.text(`Child: ${childName}`, 20, y);
      y += 10;
      doc.text(`Period: ${monthName} ${yearName}`, 20, y);
      y += 20;

      // Scheduled Medications Table
      if (filteredLogs.filter(log => !log.is_prn).length > 0) {
        doc.setFontSize(16);
        doc.text('Scheduled Medications', 20, y);
        y += 10;

        const scheduledTableData = filteredLogs.filter(log => !log.is_prn).map(log => [
          log.medication_name,
          log.child_name,
          `${log.amount_given} ${log.unit}`,
          log.due_datetime ? format(new Date(log.due_datetime), 'MMM dd, yyyy HH:mm') : 'N/A',
          format(new Date(log.given_datetime), 'MMM dd, yyyy HH:mm'),
          log.was_given ? 'Given' : 'Not Given',
          log.was_given ? '' : (log.reason_not_given || '')
        ]);

        autoTable(doc, {
          head: [['Medication', 'Child', 'Dose', 'Due Time', 'Given Time', 'Status', 'Reason']],
          body: scheduledTableData,
          startY: y,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });

        y = (doc as any).lastAutoTable.finalY + 20;
      }

      // PRN Medications Table
      if (filteredLogs.filter(log => log.is_prn).length > 0) {
        doc.setFontSize(16);
        doc.text('PRN Medications', 20, y);
        y += 10;

        const prnTableData = filteredLogs.filter(log => log.is_prn).map(log => [
          log.medication_name,
          log.child_name,
          `${log.amount_given} ${log.unit}`,
          format(new Date(log.given_datetime), 'MMM dd, yyyy HH:mm'),
          log.reason_given || ''
        ]);

        autoTable(doc, {
          head: [['Medication', 'Child', 'Dose', 'Date/Time', 'Reason Given']],
          body: prnTableData,
          startY: y,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [16, 185, 129] },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, 20, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
      }

      doc.save(`medication-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF exported successfully",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
              {isMobile && <SidebarTrigger className="mr-4" />}
              <h1 className="text-xl font-semibold">Dose History</h1>
            </div>
          </header>
          <main className="flex-1 max-w-full overflow-x-hidden">
            <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">View and Export Records</h2>
                <p className="text-muted-foreground">
                  View and export medication dose records
                </p>
              </div>
              <Button 
                onClick={exportToPDF} 
                disabled={exporting || filteredLogs.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription>
                  Filter dose history by child and date range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Child
                    </label>
                    <Select value={selectedChild} onValueChange={setSelectedChild}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select child" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Children</SelectItem>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.first_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Month</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Results</label>
                    <div className="text-sm text-muted-foreground pt-2">
                      {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {filteredLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No dose records found for the selected filters.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="scheduled" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scheduled">
                    Scheduled ({scheduledLogs.length})
                  </TabsTrigger>
                  <TabsTrigger value="prn">
                    PRN ({prnLogs.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scheduled" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Scheduled Medications</CardTitle>
                      <CardDescription>
                        Regular medication doses with given/not given status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {scheduledLogs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No scheduled medication records found.
                        </p>
                      ) : (
                        <>
                          {/* Mobile Card Layout */}
                          <div className="block md:hidden space-y-4">
                            {scheduledLogs.map((log) => (
                              <Card key={log.id} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm leading-tight break-words">
                                        {log.medication_name}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {log.child_name}
                                      </p>
                                    </div>
                                    <Badge variant={log.was_given ? "default" : "destructive"} className="text-xs flex-shrink-0">
                                      {log.was_given ? "Given" : "Not Given"}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Dose:</span>
                                      <p className="font-medium">{log.amount_given} {log.unit}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Given Time:</span>
                                      <p className="font-medium">{format(new Date(log.given_datetime), 'MMM dd, HH:mm')}</p>
                                    </div>
                                  </div>
                                  
                                  {log.due_datetime && (
                                    <div className="grid grid-cols-1 gap-3 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Due Time:</span>
                                        <p className="font-medium">{format(new Date(log.due_datetime), 'MMM dd, HH:mm')}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {!log.was_given && log.reason_not_given && (
                                    <div className="pt-2 border-t">
                                      <span className="text-xs text-muted-foreground">Reason not given:</span>
                                      <p className="text-xs mt-1">{log.reason_not_given}</p>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>

                          {/* Desktop Table Layout */}
                          <div className="hidden md:block">
                            <div className="overflow-x-auto -mx-6 px-6">
                              <div className="inline-block min-w-full align-middle">
                                <Table className="min-w-full">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('medication_name')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Medication
                                          {getSortIcon('medication_name')}
                                        </div>
                                      </TableHead>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('child_name')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Child
                                          {getSortIcon('child_name')}
                                        </div>
                                      </TableHead>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('amount_given')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Dose
                                          {getSortIcon('amount_given')}
                                        </div>
                                      </TableHead>
                                      <TableHead className="whitespace-nowrap">Due Time</TableHead>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('given_datetime')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Given Time
                                          {getSortIcon('given_datetime')}
                                        </div>
                                      </TableHead>
                                      <TableHead className="whitespace-nowrap">Status</TableHead>
                                      <TableHead className="whitespace-nowrap">Reason</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {scheduledLogs.map((log) => (
                                      <TableRow key={log.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                          {log.medication_name}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{log.child_name}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {log.amount_given} {log.unit}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {log.due_datetime ? (
                                            format(new Date(log.due_datetime), 'MMM dd, yyyy HH:mm')
                                          ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {format(new Date(log.given_datetime), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={log.was_given ? "default" : "destructive"}>
                                            {log.was_given ? "Given" : "Not Given"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {!log.was_given && log.reason_not_given ? (
                                            <span className="text-sm text-muted-foreground">
                                              {log.reason_not_given}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="prn" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>PRN Medications</CardTitle>
                      <CardDescription>
                        As-needed medication doses with reasons for administration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {prnLogs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No PRN medication records found.
                        </p>
                      ) : (
                        <>
                          {/* Mobile Card Layout */}
                          <div className="block md:hidden space-y-4">
                            {prnLogs.map((log) => (
                              <Card key={log.id} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm leading-tight break-words">
                                        {log.medication_name}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {log.child_name}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      PRN
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Dose:</span>
                                      <p className="font-medium">{log.amount_given} {log.unit}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Date/Time:</span>
                                      <p className="font-medium">{format(new Date(log.given_datetime), 'MMM dd, HH:mm')}</p>
                                    </div>
                                  </div>
                                  
                                  {log.reason_given && (
                                    <div className="pt-2 border-t">
                                      <span className="text-xs text-muted-foreground">Reason given:</span>
                                      <p className="text-xs mt-1">{log.reason_given}</p>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>

                          {/* Desktop Table Layout */}
                          <div className="hidden md:block">
                            <div className="overflow-x-auto -mx-6 px-6">
                              <div className="inline-block min-w-full align-middle">
                                <Table className="min-w-full">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('medication_name')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Medication
                                          {getSortIcon('medication_name')}
                                        </div>
                                      </TableHead>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('child_name')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Child
                                          {getSortIcon('child_name')}
                                        </div>
                                      </TableHead>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('amount_given')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Dose
                                          {getSortIcon('amount_given')}
                                        </div>
                                      </TableHead>
                                      <TableHead 
                                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                                        onClick={() => handleSort('given_datetime')}
                                      >
                                        <div className="flex items-center gap-2">
                                          Date/Time
                                          {getSortIcon('given_datetime')}
                                        </div>
                                      </TableHead>
                                      <TableHead className="whitespace-nowrap">Reason Given</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {prnLogs.map((log) => (
                                      <TableRow key={log.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                          {log.medication_name}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{log.child_name}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {log.amount_given} {log.unit}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {format(new Date(log.given_datetime), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                          <span className="text-sm">
                                            {log.reason_given || "-"}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left order-2 sm:order-1">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} records
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="min-h-[36px] touch-manipulation"
                  >
                    Previous
                  </Button>
                  <span className="text-sm whitespace-nowrap px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="min-h-[36px] touch-manipulation"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default History;