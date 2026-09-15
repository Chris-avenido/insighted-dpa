import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export function PositionBreakdownCards() {
  const { records, kpis } = useApp();

  const [filledSlide, setFilledSlide] = useState(0);
  const [unfilledSlide, setUnfilledSlide] = useState(0);

  // Split records into Filled and Unfilled subsets
  const { filledRecords, unfilledRecords } = useMemo(() => {
    const list = Array.isArray(records) ? records : [];
    const filled = [];
    const unfilled = [];

    list.forEach(r => {
      const posStatus = (r.position_status || r['POSITION STATUS'] || '').toString().toUpperCase();
      const itemStatus = (r.item_status || r.ITEM_STATUS || '').toString().toLowerCase();
      const isAudited = r.is_audited === true;

      // In DPA logic: position_status === 'FILLED' is filled; UNFILLED or default is unfilled
      if (posStatus === 'FILLED') {
        filled.push(r);
      } else {
        unfilled.push(r);
      }
    });

    return { filledRecords: filled, unfilledRecords: unfilled };
  }, [records]);

  // Derive totals from records (with fallback to KPI summary object if records still hydrating)
  const totalFilled = useMemo(() => {
    if (filledRecords.length > 0) return filledRecords.length;
    return kpis.auditedItems ?? kpis.totalAudited ?? 0;
  }, [filledRecords, kpis]);

  const totalUnfilled = useMemo(() => {
    if (unfilledRecords.length > 0) return unfilledRecords.length;
    return kpis.remainingItems ?? kpis.totalUnfilled ?? 0;
  }, [unfilledRecords, kpis]);

  // Helper to compute dynamic breakdowns for a given record list
  const computeBreakdowns = (recordList, isFilled) => {
    const totalCount = recordList.length || 1;

    // Slide 0: Position Category Breakdown (Primary Default)
    const categoryCounts = {
      Teaching: 0,
      'Non-Teaching': 0,
      'Teaching-Related': 0
    };

    // Slide 1: Item Status Breakdown
    const statusCounts = {
      Regular: 0,
      CTI: 0,
      Others: 0
    };

    // Slide 2: Salary Grade Distribution
    const sgCounts = {
      'SG 1 - 10': 0,
      'SG 11 - 15': 0,
      'SG 16 - 24': 0,
      'SG 25+': 0
    };

    // Slide 3: Aging / Classification Breakdown
    const agingCounts = isFilled
      ? { 'Regular Active': 0, 'Newly Appointed': 0, 'Verified Audited': 0 }
      : { 'Newly Created (0-1 yr)': 0, 'Extended (1-2 yrs)': 0, 'Long-Term (2+ yrs)': 0 };

    recordList.forEach(r => {
      // 1. Category
      const cat = r.position_category || r['POSITION CATEGORY'] || 'Teaching';
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      } else if (cat.includes('Non')) {
        categoryCounts['Non-Teaching']++;
      } else if (cat.includes('Related')) {
        categoryCounts['Teaching-Related']++;
      } else {
        categoryCounts['Teaching']++;
      }

      // 2. Status
      const st = (r.item_status || r.ITEM_STATUS || 'Regular').toString();
      if (st.toLowerCase().includes('cti')) statusCounts['CTI']++;
      else if (st.toLowerCase().includes('reg')) statusCounts['Regular']++;
      else statusCounts['Others']++;

      // 3. Salary Grade
      const sgNum = parseInt(r.sg || r.SG || 0, 10);
      if (sgNum >= 25) sgCounts['SG 25+']++;
      else if (sgNum >= 16) sgCounts['SG 16 - 24']++;
      else if (sgNum >= 11) sgCounts['SG 11 - 15']++;
      else sgCounts['SG 1 - 10']++;

      // 4. Aging / Tenure
      if (!isFilled) {
        const aging = (r.vacancy_aging_status || '').toString().toLowerCase();
        if (aging.includes('newly') || aging.includes('0-1')) agingCounts['Newly Created (0-1 yr)']++;
        else if (aging.includes('extended') || aging.includes('1-2')) agingCounts['Extended (1-2 yrs)']++;
        else agingCounts['Long-Term (2+ yrs)']++;
      } else {
        if (r.is_audited) agingCounts['Verified Audited']++;
        else agingCounts['Regular Active']++;
      }
    });

    return [
      {
        title: 'CATEGORY',
        items: [
          { label: 'Teaching', count: categoryCounts['Teaching'] },
          { label: 'Non-Teaching', count: categoryCounts['Non-Teaching'] },
          { label: 'Teaching-Related', count: categoryCounts['Teaching-Related'] }
        ]
      },
      {
        title: 'ITEM STATUS',
        items: [
          { label: 'Regular Plantilla', count: statusCounts['Regular'] },
          { label: 'CTI Position', count: statusCounts['CTI'] },
          { label: 'Other Special', count: statusCounts['Others'] }
        ]
      },
      {
        title: 'SALARY GRADE',
        items: [
          { label: 'SG 1 - 10 (Sub-Prof)', count: sgCounts['SG 1 - 10'] },
          { label: 'SG 11 - 15 (Prof)', count: sgCounts['SG 11 - 15'] },
          { label: 'SG 16 - 24 (Senior)', count: sgCounts['SG 16 - 24'] },
          { label: 'SG 25+ (Executive)', count: sgCounts['SG 25+'] }
        ]
      },
      {
        title: isFilled ? 'STATUS AUDIT' : 'VACANCY AGING',
        items: Object.entries(agingCounts).map(([label, count]) => ({ label, count }))
      }
    ];
  };

  const filledSlides = useMemo(() => computeBreakdowns(filledRecords, true), [filledRecords]);
  const unfilledSlides = useMemo(() => computeBreakdowns(unfilledRecords, false), [unfilledRecords]);

  // Render helper for single Card
  const renderCard = ({
    title,
    subtitle = 'after audit',
    total,
    accentColor, // 'emerald' | 'rose'
    slides,
    currentSlide,
    onSlideChange
  }) => {
    const isEmerald = accentColor === 'emerald';
    const activeData = slides[currentSlide] || slides[0];
    const maxCount = Math.max(...activeData.items.map(i => i.count), 1);

    const totalSlides = slides.length;

    const handlePrev = () => {
      onSlideChange((currentSlide - 1 + totalSlides) % totalSlides);
    };

    const handleNext = () => {
      onSlideChange((currentSlide + 1) % totalSlides);
    };

    return (
      <div className="card-glass relative rounded-2xl p-5 md:p-6 border border-slate-200/90 dark:border-slate-700/90 shadow-sm flex flex-col justify-between overflow-hidden group">
        <div className="specular-sheen"></div>

        {/* Left vertical accent border */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
            isEmerald ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        <div className="relative z-10">
          {/* Card Top: Title, Subtitle, and Big Total Count */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-100 tracking-wider uppercase">
                {title}
              </h3>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block mt-0.5">
                {subtitle}
              </span>
            </div>
            <div className="text-right">
              <strong className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums block">
                {Number(total).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/80 dark:border-slate-700/80 my-3.5" />

          {/* Table Header Row: Dimension Name vs Count */}
          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 dark:text-slate-400 tracking-wider uppercase mb-2.5">
            <span>{activeData.title}</span>
            <span>COUNT</span>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2.5 min-h-[96px] flex flex-col justify-center">
            {activeData.items.map((item, idx) => {
              const count = item.count || 0;
              const barPercent = Math.min(100, Math.max(4, Math.round((count / maxCount) * 100)));

              return (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs md:text-sm">
                  {/* Category Label */}
                  <span className="font-bold text-slate-700 dark:text-slate-200 w-28 md:w-36 flex-shrink-0 truncate" title={item.label}>
                    {item.label}
                  </span>

                  {/* Horizontal Progress Bar */}
                  <div className="flex-1 h-2 md:h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isEmerald
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : 'bg-gradient-to-r from-rose-400 to-rose-500'
                      }`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>

                  {/* Count Value */}
                  <span className="font-extrabold text-slate-800 dark:text-white text-right w-16 md:w-20 flex-shrink-0 tabular-nums">
                    {Number(count).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Carousel / Slide Pagination Controls */}
        <div className="relative z-10 pt-4 mt-auto flex items-center justify-center gap-2">
          {/* Prev Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition cursor-pointer"
            title="Previous breakdown"
          >
            ‹
          </button>

          {/* Indicator Dots */}
          <div className="flex items-center gap-1.5 px-1">
            {slides.map((_, idx) => {
              const isActive = idx === currentSlide;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSlideChange(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? isEmerald
                        ? 'w-4 h-1.5 bg-emerald-500 shadow-xs'
                        : 'w-4 h-1.5 bg-rose-500 shadow-xs'
                      : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                  }`}
                  title={`Slide ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition cursor-pointer"
            title="Next breakdown"
          >
            ›
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Filled Positions Card */}
      {renderCard({
        title: 'FILLED POSITIONS',
        subtitle: 'after audit',
        total: totalFilled,
        accentColor: 'emerald',
        slides: filledSlides,
        currentSlide: filledSlide,
        onSlideChange: setFilledSlide
      })}

      {/* Unfilled Positions Card */}
      {renderCard({
        title: 'UNFILLED POSITIONS',
        subtitle: 'after audit',
        total: totalUnfilled,
        accentColor: 'rose',
        slides: unfilledSlides,
        currentSlide: unfilledSlide,
        onSlideChange: setUnfilledSlide
      })}
    </div>
  );
}

export default PositionBreakdownCards;
