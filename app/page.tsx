/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import domtoimage from 'dom-to-image-more';

interface Activity {
  activityName: string;
  activityDay: string;
  activityDescription: string;
  activityStartTime: string;
  activityStopTime: string;
  activityBackgroundColor: string;
  activityDetailedContent: string;
}

interface DaySchedule {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  activities: Activity[];
  fullDate: Date;
}

function parseDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split('-');
  return new Date(`${month} ${day}, ${year}`);
}

function formatDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayOfWeek(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function groupActivitiesByDay(activities: Activity[]): DaySchedule[] {
  const days: { [key: string]: Activity[] } = {};
  for (const activity of activities) {
    if (!days[activity.activityDay]) {
      days[activity.activityDay] = [];
    }
    days[activity.activityDay].push(activity);
  }
  const result: DaySchedule[] = [];
  for (const [date, dayActivities] of Object.entries(days)) {
    result.push({
      date,
      formattedDate: formatDate(date),
      dayOfWeek: getDayOfWeek(date),
      activities: dayActivities.sort((a, b) =>
        a.activityStartTime.localeCompare(b.activityStartTime)
      ),
      fullDate: parseDate(date)
    });
  }
  return result.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getActivityColor(activity: Activity): string {
  if (activity.activityBackgroundColor && activity.activityBackgroundColor !== '#fff') {
    return activity.activityBackgroundColor;
  }
  const name = activity.activityName.toLowerCase();
  if (name.includes('breakfast')) return '#FFF2CC';
  if (name.includes('lunch')) return '#D1E3FF';
  if (name.includes('dinner')) return '#FFCCDC';
  if (name.includes('workshop')) return '#CDEAC0';
  if (name.includes('promotion')) return '#E7D2F3';
  if (name.includes('setup')) return '#FFE0B2';
  if (name.includes('customer')) return '#D6DDE8';
  if (name.includes('cleanup')) return '#E8E8E8';
  if (name.includes('exploration')) return '#B2EBF2';
  if (name.includes('museum')) return '#FFF59D';
  if (name.includes('run')) return '#B3E5FC';
  if (name.includes('venue')) return '#D4EDDA';
  if (name.includes('fruit')) return '#FFE0B2';
  if (name.includes('table')) return '#FFD6C4';
  if (name.includes('arrive')) return '#D5F5E3';
  return '#F4F6F8';
}

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [days, setDays] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const scheduleRef = useRef<HTMLDivElement>(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('https://juice.hackclub.com/itinerary.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        const hasApril11 = data.some(
          (act: Activity) => act.activityDay === 'April-11-2025'
        );
        if (!hasApril11) {
          data.push(
            {
              activityName: 'Daily Fruit Run',
              activityDay: 'April-11-2025',
              activityDescription: 'We all fill the tote bags',
              activityStartTime: '6:00',
              activityStopTime: '8:00',
              activityBackgroundColor: '#B3E5FC',
              activityDetailedContent: ''
            },
            {
              activityName: 'Breakfast',
              activityDay: 'April-11-2025',
              activityDescription: 'Morning meal',
              activityStartTime: '7:00',
              activityStopTime: '9:00',
              activityBackgroundColor: '#FFF2CC',
              activityDetailedContent: ''
            },
            {
              activityName: 'Final Customer Session',
              activityDay: 'April-11-2025',
              activityDescription: 'Last day with visitors',
              activityStartTime: '9:00',
              activityStopTime: '12:00',
              activityBackgroundColor: '#D6DDE8',
              activityDetailedContent: 'Saying goodbye to regular customers'
            },
            {
              activityName: 'Closing Ceremony',
              activityDay: 'April-11-2025',
              activityDescription: 'Wrap-up event',
              activityStartTime: '14:00',
              activityStopTime: '16:00',
              activityBackgroundColor: '#E7D2F3',
              activityDetailedContent: 'Final celebration and acknowledgments'
            },
            {
              activityName: 'Final Cleanup & Packing',
              activityDay: 'April-11-2025',
              activityDescription: 'Complete teardown',
              activityStartTime: '16:30',
              activityStopTime: '19:00',
              activityBackgroundColor: '#E8E8E8',
              activityDetailedContent: 'Pack all equipment and leave venue spotless'
            }
          );
        }

        setActivities(data);
        setDays(groupActivitiesByDay(data));
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch itinerary:', err);
        setError('Failed to load itinerary data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const downloadAsPDF = async () => {
    if (!scheduleRef.current) return;
    try {
      setExportLoading(true);
      
      scheduleRef.current.classList.add('export-mode');
      
      const element = scheduleRef.current;
      const allElements = element.querySelectorAll('*');
      
      const originalStyles = new Map();
      
      allElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const backgroundColor = computedStyle.backgroundColor;
        const color = computedStyle.color;
        const borderColor = computedStyle.borderColor;
        const borderWidth = computedStyle.borderWidth;
        const borderStyle = computedStyle.borderStyle;
        const borderLeftColor = computedStyle.borderLeftColor;
        const borderLeftWidth = computedStyle.borderLeftWidth;
        const borderLeftStyle = computedStyle.borderLeftStyle;
        const borderRightColor = computedStyle.borderRightColor;
        const borderRightWidth = computedStyle.borderRightWidth;
        const borderRightStyle = computedStyle.borderRightStyle;
        const borderTopColor = computedStyle.borderTopColor;
        const borderTopWidth = computedStyle.borderTopWidth;
        const borderTopStyle = computedStyle.borderTopStyle;
        const borderBottomColor = computedStyle.borderBottomColor;
        const borderBottomWidth = computedStyle.borderBottomWidth;
        const borderBottomStyle = computedStyle.borderBottomStyle;
        
        originalStyles.set(el, {
          backgroundColor: (el as HTMLElement).style.backgroundColor,
          color: (el as HTMLElement).style.color,
          borderColor: (el as HTMLElement).style.borderColor,
          borderWidth: (el as HTMLElement).style.borderWidth,
          borderStyle: (el as HTMLElement).style.borderStyle,
          borderLeftColor: (el as HTMLElement).style.borderLeftColor,
          borderLeftWidth: (el as HTMLElement).style.borderLeftWidth,
          borderLeftStyle: (el as HTMLElement).style.borderLeftStyle,
          borderRightColor: (el as HTMLElement).style.borderRightColor,
          borderRightWidth: (el as HTMLElement).style.borderRightWidth,
          borderRightStyle: (el as HTMLElement).style.borderRightStyle,
          borderTopColor: (el as HTMLElement).style.borderTopColor,
          borderTopWidth: (el as HTMLElement).style.borderTopWidth,
          borderTopStyle: (el as HTMLElement).style.borderTopStyle,
          borderBottomColor: (el as HTMLElement).style.borderBottomColor,
          borderBottomWidth: (el as HTMLElement).style.borderBottomWidth,
          borderBottomStyle: (el as HTMLElement).style.borderBottomStyle
        });
        
        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.backgroundColor = backgroundColor;
        }
        if (color) {
          (el as HTMLElement).style.color = color;
        }
        
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderColor = borderColor;
        }
        if (borderWidth) {
          (el as HTMLElement).style.borderWidth = borderWidth;
        }
        if (borderStyle) {
          (el as HTMLElement).style.borderStyle = borderStyle;
        }
        
        if (borderLeftColor && borderLeftColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderLeftColor = borderLeftColor;
        }
        if (borderLeftWidth) {
          (el as HTMLElement).style.borderLeftWidth = borderLeftWidth;
        }
        if (borderLeftStyle) {
          (el as HTMLElement).style.borderLeftStyle = borderLeftStyle;
        }
        
        if (borderRightColor && borderRightColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderRightColor = borderRightColor;
        }
        if (borderRightWidth) {
          (el as HTMLElement).style.borderRightWidth = borderRightWidth;
        }
        if (borderRightStyle) {
          (el as HTMLElement).style.borderRightStyle = borderRightStyle;
        }
        
        if (borderTopColor && borderTopColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderTopColor = borderTopColor;
        }
        if (borderTopWidth) {
          (el as HTMLElement).style.borderTopWidth = borderTopWidth;
        }
        if (borderTopStyle) {
          (el as HTMLElement).style.borderTopStyle = borderTopStyle;
        }
        
        if (borderBottomColor && borderBottomColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderBottomColor = borderBottomColor;
        }
        if (borderBottomWidth) {
          (el as HTMLElement).style.borderBottomWidth = borderBottomWidth;
        }
        if (borderBottomStyle) {
          (el as HTMLElement).style.borderBottomStyle = borderBottomStyle;
        }
      });
      
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1.0,
        scale: 2,
        bgcolor: '#ffffff',
        filter: (node: any) => {
          return (node.tagName !== 'svg:svg');
        }
      });
      
      allElements.forEach((el) => {
        const original = originalStyles.get(el);
        if (original) {
          (el as HTMLElement).style.backgroundColor = original.backgroundColor;
          (el as HTMLElement).style.color = original.color;
          (el as HTMLElement).style.borderColor = original.borderColor;
          (el as HTMLElement).style.borderWidth = original.borderWidth;
          (el as HTMLElement).style.borderStyle = original.borderStyle;
          (el as HTMLElement).style.borderLeftColor = original.borderLeftColor;
          (el as HTMLElement).style.borderLeftWidth = original.borderLeftWidth;
          (el as HTMLElement).style.borderLeftStyle = original.borderLeftStyle;
          (el as HTMLElement).style.borderRightColor = original.borderRightColor;
          (el as HTMLElement).style.borderRightWidth = original.borderRightWidth;
          (el as HTMLElement).style.borderRightStyle = original.borderRightStyle;
          (el as HTMLElement).style.borderTopColor = original.borderTopColor;
          (el as HTMLElement).style.borderTopWidth = original.borderTopWidth;
          (el as HTMLElement).style.borderTopStyle = original.borderTopStyle;
          (el as HTMLElement).style.borderBottomColor = original.borderBottomColor;
          (el as HTMLElement).style.borderBottomWidth = original.borderBottomWidth;
          (el as HTMLElement).style.borderBottomStyle = original.borderBottomStyle;
        }
      });
      
      scheduleRef.current.classList.remove('export-mode');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        const width = imgWidth * ratio;
        const height = imgHeight * ratio;
        
        const x = (pdfWidth - width) / 2;
        const y = (pdfHeight - height) / 2;
        
        pdf.addImage(dataUrl, 'PNG', x, y, width, height);
        pdf.save('juice-cafe-itinerary.pdf');
        setExportLoading(false);
      };
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please check the console for errors.');
      setExportLoading(false);
    }
  };
  
  const downloadAsPNG = async () => {
    if (!scheduleRef.current) return;
    try {
      setExportLoading(true);
      
      scheduleRef.current.classList.add('export-mode');
      
      const element = scheduleRef.current;
      const allElements = element.querySelectorAll('*');
    
      const originalStyles = new Map();
      
      allElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const backgroundColor = computedStyle.backgroundColor;
        const color = computedStyle.color;
        const borderColor = computedStyle.borderColor;
        const borderWidth = computedStyle.borderWidth;
        const borderStyle = computedStyle.borderStyle;
        const borderLeftColor = computedStyle.borderLeftColor;
        const borderLeftWidth = computedStyle.borderLeftWidth;
        const borderLeftStyle = computedStyle.borderLeftStyle;
        const borderRightColor = computedStyle.borderRightColor;
        const borderRightWidth = computedStyle.borderRightWidth;
        const borderRightStyle = computedStyle.borderRightStyle;
        const borderTopColor = computedStyle.borderTopColor;
        const borderTopWidth = computedStyle.borderTopWidth;
        const borderTopStyle = computedStyle.borderTopStyle;
        const borderBottomColor = computedStyle.borderBottomColor;
        const borderBottomWidth = computedStyle.borderBottomWidth;
        const borderBottomStyle = computedStyle.borderBottomStyle;
        
        originalStyles.set(el, {
          backgroundColor: (el as HTMLElement).style.backgroundColor,
          color: (el as HTMLElement).style.color,
          borderColor: (el as HTMLElement).style.borderColor,
          borderWidth: (el as HTMLElement).style.borderWidth,
          borderStyle: (el as HTMLElement).style.borderStyle,
          borderLeftColor: (el as HTMLElement).style.borderLeftColor,
          borderLeftWidth: (el as HTMLElement).style.borderLeftWidth,
          borderLeftStyle: (el as HTMLElement).style.borderLeftStyle,
          borderRightColor: (el as HTMLElement).style.borderRightColor,
          borderRightWidth: (el as HTMLElement).style.borderRightWidth,
          borderRightStyle: (el as HTMLElement).style.borderRightStyle,
          borderTopColor: (el as HTMLElement).style.borderTopColor,
          borderTopWidth: (el as HTMLElement).style.borderTopWidth,
          borderTopStyle: (el as HTMLElement).style.borderTopStyle,
          borderBottomColor: (el as HTMLElement).style.borderBottomColor,
          borderBottomWidth: (el as HTMLElement).style.borderBottomWidth,
          borderBottomStyle: (el as HTMLElement).style.borderBottomStyle
        });
        
        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.backgroundColor = backgroundColor;
        }
        if (color) {
          (el as HTMLElement).style.color = color;
        }
        
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderColor = borderColor;
        }
        if (borderWidth) {
          (el as HTMLElement).style.borderWidth = borderWidth;
        }
        if (borderStyle) {
          (el as HTMLElement).style.borderStyle = borderStyle;
        }
        
        if (borderLeftColor && borderLeftColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderLeftColor = borderLeftColor;
        }
        if (borderLeftWidth) {
          (el as HTMLElement).style.borderLeftWidth = borderLeftWidth;
        }
        if (borderLeftStyle) {
          (el as HTMLElement).style.borderLeftStyle = borderLeftStyle;
        }
        
        if (borderRightColor && borderRightColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderRightColor = borderRightColor;
        }
        if (borderRightWidth) {
          (el as HTMLElement).style.borderRightWidth = borderRightWidth;
        }
        if (borderRightStyle) {
          (el as HTMLElement).style.borderRightStyle = borderRightStyle;
        }
        
        if (borderTopColor && borderTopColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderTopColor = borderTopColor;
        }
        if (borderTopWidth) {
          (el as HTMLElement).style.borderTopWidth = borderTopWidth;
        }
        if (borderTopStyle) {
          (el as HTMLElement).style.borderTopStyle = borderTopStyle;
        }
        
        if (borderBottomColor && borderBottomColor !== 'rgba(0, 0, 0, 0)') {
          (el as HTMLElement).style.borderBottomColor = borderBottomColor;
        }
        if (borderBottomWidth) {
          (el as HTMLElement).style.borderBottomWidth = borderBottomWidth;
        }
        if (borderBottomStyle) {
          (el as HTMLElement).style.borderBottomStyle = borderBottomStyle;
        }
      });
      
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1.0,
        scale: 2,
        bgcolor: '#ffffff',
        filter: (node: any) => {
          return (node.tagName !== 'svg:svg');
        }
      });
      
      allElements.forEach((el) => {
        const original = originalStyles.get(el);
        if (original) {
          (el as HTMLElement).style.backgroundColor = original.backgroundColor;
          (el as HTMLElement).style.color = original.color;
          (el as HTMLElement).style.borderColor = original.borderColor;
          (el as HTMLElement).style.borderWidth = original.borderWidth;
          (el as HTMLElement).style.borderStyle = original.borderStyle;
          (el as HTMLElement).style.borderLeftColor = original.borderLeftColor;
          (el as HTMLElement).style.borderLeftWidth = original.borderLeftWidth;
          (el as HTMLElement).style.borderLeftStyle = original.borderLeftStyle;
          (el as HTMLElement).style.borderRightColor = original.borderRightColor;
          (el as HTMLElement).style.borderRightWidth = original.borderRightWidth;
          (el as HTMLElement).style.borderRightStyle = original.borderRightStyle;
          (el as HTMLElement).style.borderTopColor = original.borderTopColor;
          (el as HTMLElement).style.borderTopWidth = original.borderTopWidth;
          (el as HTMLElement).style.borderTopStyle = original.borderTopStyle;
          (el as HTMLElement).style.borderBottomColor = original.borderBottomColor;
          (el as HTMLElement).style.borderBottomWidth = original.borderBottomWidth;
          (el as HTMLElement).style.borderBottomStyle = original.borderBottomStyle;
        }
      });
      
      scheduleRef.current.classList.remove('export-mode');
      
      const link = document.createElement('a');
      link.download = 'juice-cafe-itinerary.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportLoading(false);
    } catch (err) {
      console.error('Error generating PNG:', err);
      alert('Failed to generate PNG. Please check the console for errors.');
      setExportLoading(false);
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'week' ? 'day' : 'week'));
  };

  const changeSelectedDay = (idx: number) => {
    setSelectedDayIndex(idx);
  };

  const openActivityModal = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const closeModal = () => {
    setSelectedActivity(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading Juice Café itinerary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Data</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayDays = viewMode === 'week' ? days.slice(0, 8) : [days[selectedDayIndex]];

  return (
    <div className="bg-gray-50 min-h-screen relative">
      <header className="bg-purple-700 py-6 px-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto">
          <h1 className="text-white text-3xl md:text-4xl font-bold text-center">
            Juice Café Shanghai Itinerary
          </h1>
          <p className="text-white text-center mt-2">April 4-11, 2025</p>
          <div className="flex flex-wrap justify-center mt-4 gap-2">
            <button
              onClick={toggleViewMode}
              className="bg-white text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-lg font-medium shadow-md transition-colors"
            >
              {viewMode === 'week' ? 'Day View' : 'Week View'}
            </button>

            {viewMode === 'day' && (
              <div className="flex items-center bg-white rounded-lg shadow-md">
                <button
                  onClick={() => changeSelectedDay(Math.max(0, selectedDayIndex - 1))}
                  disabled={selectedDayIndex === 0}
                  className="px-3 py-2 text-purple-700 hover:bg-purple-100 disabled:opacity-50 disabled:hover:bg-white rounded-l-lg"
                >
                  ◀
                </button>
                <select
                  value={selectedDayIndex}
                  onChange={(e) => changeSelectedDay(Number(e.target.value))}
                  className="border-0 focus:ring-0 text-purple-700 bg-white"
                >
                  {days.map((day, idx) => (
                    <option key={day.date} value={idx}>
                      {day.dayOfWeek} ({day.formattedDate})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => changeSelectedDay(Math.min(days.length - 1, selectedDayIndex + 1))}
                  disabled={selectedDayIndex === days.length - 1}
                  className="px-3 py-2 text-purple-700 hover:bg-purple-100 disabled:opacity-50 disabled:hover:bg-white rounded-r-lg"
                >
                  ▶
                </button>
              </div>
            )}

            <button
              onClick={downloadAsPDF}
              disabled={exportLoading}
              className="bg-white text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-lg font-medium shadow-md transition-colors"
            >
              {exportLoading ? 'Processing...' : 'Download PDF'}
            </button>
            <button
              onClick={downloadAsPNG}
              disabled={exportLoading}
              className="bg-white text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-lg font-medium shadow-md transition-colors"
            >
              {exportLoading ? 'Processing...' : 'Download PNG'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {exportLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-600"></div>
                <p className="text-lg font-medium">Generating your download...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={scheduleRef} className="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
          <div className={`grid ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-1'} border-b`}>
            {displayDays.map((day) => (
              <div key={day.date} className="border-r last:border-r-0">
                <div className="bg-gray-800 text-white p-4 text-center">
                  <div className={`font-bold ${viewMode === 'day' ? 'text-xl' : 'text-base'}`}>
                    {day.dayOfWeek}
                  </div>
                  <div className={viewMode === 'day' ? 'text-base' : 'text-sm'}>
                    {day.formattedDate}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`grid ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-1'}`}>
            {displayDays.map((day) => (
              <div key={day.date} className="border-r last:border-r-0">
                <div className="p-4 space-y-4">
                  {day.activities.length === 0 && (
                    <div className="text-gray-500 italic">No activities</div>
                  )}
                  {day.activities.map((activity, idx) => {
                    const bgColor = getActivityColor(activity);
                    const borderColor = activity.activityName.toLowerCase().includes('fruit run')
                      ? '#3B82F6'
                      : activity.activityName.toLowerCase().includes('breakfast')
                      ? '#F59E0B'
                      : activity.activityName.toLowerCase().includes('setup')
                      ? '#F97316'
                      : activity.activityName.toLowerCase().includes('promotion')
                      ? '#A855F7'
                      : activity.activityName.toLowerCase().includes('customer')
                      ? '#6366F1'
                      : activity.activityName.toLowerCase().includes('cleanup')
                      ? '#6B7280'
                      : activity.activityName.toLowerCase().includes('venue')
                      ? '#22C55E'
                      : activity.activityName.toLowerCase().includes('museum')
                      ? '#F87171'
                      : '#8B5CF6';

                    return (
                      <div
                        key={idx}
                        onClick={() => openActivityModal(activity)}
                        className="cursor-pointer p-3 border-l-4 transition-shadow hover:shadow-md"
                        style={{ backgroundColor: bgColor, borderColor }}
                      >
                        <div className={`text-gray-600 font-medium ${viewMode === 'day' ? 'text-sm' : 'text-xs'}`}>
                          {formatTime(activity.activityStartTime)} - {formatTime(activity.activityStopTime)}
                        </div>
                        <h3 className={`font-bold mt-1 text-gray-800 ${viewMode === 'day' ? 'text-lg' : 'text-sm'} truncate`}>
                          {activity.activityName}
                        </h3>
                        <p className={`mt-1 text-gray-600 ${viewMode === 'day' ? 'text-sm' : 'text-xs'}`}>
                          {activity.activityDescription.length > 50
                            ? activity.activityDescription.substring(0, 50) + '...'
                            : activity.activityDescription}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedActivity.activityName}</h2>
            <p className="text-gray-600 mb-2">
              <span className="font-medium">Time:</span> {formatTime(selectedActivity.activityStartTime)} - {formatTime(selectedActivity.activityStopTime)}
            </p>
            <p className="text-gray-600 mb-4">{selectedActivity.activityDescription}</p>
            {selectedActivity.activityDetailedContent && (
              <div className="bg-gray-100 p-4 rounded mb-4">
                <p className="text-gray-700">{selectedActivity.activityDetailedContent}</p>
              </div>
            )}
            <button
              onClick={closeModal}
              className="mt-6 bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-white py-6 px-4">
        <div className="container mx-auto text-center">
          <p>Juice Café Shanghai - Hack Club - April 2025</p>
          <p className="text-sm mt-2 text-gray-400">
            Made by Hridya Agrawal
          </p>
        </div>
      </footer>
    </div>
  );
}
