"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  destinationOptions,
  activityOptions,
  tripTypeOptions,
  difficultyOptions,
} from "../data/activities";

const FIELDS = [
  {
    key: "destination",
    label: "Destination",
    defaultLabel: "All Destinations",
    icon: "ti-location-pin",
    options: destinationOptions,
    param: "destination",
  },
  {
    key: "activity",
    label: "Activity",
    defaultLabel: "All Activities",
    icon: "fa-thin fa-route",
    options: activityOptions,
    param: "activity",
  },
  {
    key: "type",
    label: "Trip Type",
    defaultLabel: "All Trip Types",
    icon: "fa-thin fa-heart",
    options: tripTypeOptions,
    param: "type",
  },
  {
    key: "difficulty",
    label: "Difficulty",
    defaultLabel: "All Difficulties",
    icon: "ti-stats-up",
    options: difficultyOptions,
    param: "difficulty",
  },
];

function SearchBarForm() {
  const [selected, setSelected] = useState({
    destination: "",
    activity: "",
    type: "",
    difficulty: "",
  });
  const [openField, setOpenField] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleField(key) {
    setOpenField((prev) => (prev === key ? null : key));
  }

  function selectOption(fieldKey, value) {
    setSelected((prev) => ({
      ...prev,
      [fieldKey]: prev[fieldKey] === value ? "" : value,
    }));
    setOpenField(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    FIELDS.forEach((field) => {
      const value = selected[field.key];
      if (value) params.set(field.param, value);
    });
    window.location.href = `/activities?${params.toString()}`;
  }

  return (
    <form className="activity-search-bar" ref={wrapRef} onSubmit={handleSubmit}>
      {FIELDS.map((field) => {
        const value = selected[field.key];
        const isOpen = openField === field.key;
        return (
          <div
            key={field.key}
            className={`as-field${isOpen ? " open" : ""}`}
            onClick={() => toggleField(field.key)}
          >
            <i className={`as-field-icon ${field.icon}`}></i>
            <span className="as-field-value">
              {value || field.defaultLabel}
            </span>
            <i className="as-field-chevron ti-angle-down"></i>

            {isOpen && (
              <div className="as-panel" onClick={(e) => e.stopPropagation()}>
                {field.options.map((opt) => (
                  <div
                    key={opt.name}
                    className={`as-option${value === opt.name ? " active" : ""}`}
                    onClick={() => selectOption(field.key, opt.name)}
                  >
                    <span>{opt.name}</span>
                    <span className="as-option-count">{opt.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button type="submit" className="as-submit">
        <span>Search</span>
        <i className="fa-light fa-arrow-right"></i>
      </button>
    </form>
  );
}

export default function ActivitySearchBar() {
  const [isFixed, setIsFixed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const NAV_HEIGHT = 85; // matches .nav-scroll's fixed height in style.css

    function onScroll() {
      const el = wrapRef.current;
      if (!el) return;
      // getBoundingClientRect() reports real on-screen position even though
      // ScrollSmoother transforms an ancestor — so this stays accurate.
      const bottom = el.getBoundingClientRect().bottom;
      setIsFixed(bottom <= NAV_HEIGHT);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div ref={wrapRef} className={`activity-search-bar-wrap${isFixed ? " is-hidden" : ""}`}>
        <div className="container">
          <SearchBarForm />
        </div>
      </div>

      {mounted && isFixed
        ? createPortal(
            <div className="activity-search-bar-fixed">
              <div className="container">
                <SearchBarForm />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
