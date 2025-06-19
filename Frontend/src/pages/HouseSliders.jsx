import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../css/HouseSliders.module.css";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const HouseSliders = () => {
  const [preprojects, setPreprojects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const { user } = useAuthContext();

  // Fetch all preprojects from the backend
  useEffect(() => {
    const fetchPreprojects = async () => {
      try {
        const response = await axios.get("https://foxconstruction-final.onrender.com/api/preprojects", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setPreprojects(response.data);
        setFilteredProjects(response.data); // Initialize the filtered list
      } catch (error) {
        console.error("Error fetching preprojects:", error);
      }
    };
    fetchPreprojects();
  }, [user]);

  // Handle the filter logic
  const handleFilter = () => {
    const min = parseInt(minBudget, 10) || 0;
    const max = parseInt(maxBudget, 10) || Infinity;

    const filtered = preprojects.filter(
      (project) =>
        project.bom.totalProjectCost >= min &&
        project.bom.totalProjectCost <= max
    );
    setFilteredProjects(filtered);
  };

  // Validation to ensure values are non-negative
  const handleMinBudgetChange = (e) => {
    const value = e.target.value;
    setMinBudget(value < 0 ? "0" : value); // Prevent negative input
  };

  const handleMaxBudgetChange = (e) => {
    const value = e.target.value;
    setMaxBudget(value < 0 ? "0" : value); // Prevent negative input
  };

  const budgetOptions = [
    { label: "1M", value: 1000000 },
    { label: "1.5M", value: 1500000 },
    { label: "2M", value: 2000000 },
    { label: "2.5M", value: 2500000 },
    { label: "3M", value: 3000000 },
    { label: "3.5M", value: 3500000 },
  ];

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Filter Section */}
        <div className={styles.filterContainer}>
          <h2>Filter by Budget</h2>
          <div className={styles.inputContainer}>
            <label htmlFor="minBudget">Min Budget</label>
            <input
              id="minBudget"
              type="number"
              placeholder="Enter minimum budget"
              value={minBudget}
              onChange={handleMinBudgetChange}
              className={styles.budgetInput}
            />
            <select
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className={styles.budgetSelect}
            >
              <option value="">Choose Min Budget</option>
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="maxBudget">Max Budget</label>
            <input
              id="maxBudget"
              type="number"
              placeholder="Enter maximum budget"
              value={maxBudget}
              onChange={handleMaxBudgetChange}
              className={styles.budgetInput}
            />
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className={styles.budgetSelect}
            >
              <option value="">Choose Max Budget</option>
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleFilter} className={styles.filterButton}>
            Filter
          </button>
        </div>

        {/* Project List */}
        <div className={styles.projectList}>
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Link
                to={`/projects/${project._id}`} // Navigate to the project details page
                key={project._id}
                className={styles.projectCard}
              >
                <img
                  src={
                    project.image && project.image.length > 0
                      ? project.image[0].path
                      : "/placeholder.jpg"
                  }
                  alt={project.title || "Project Image"}
                  className={styles.projectImage}
                />
                <div className={styles.projectDetails}>
                  <h3>{project.title}</h3>
                  <p>
                    <strong>Total Area:</strong> {project.bom.totalArea} sqm
                  </p>
                  <p>
                    <strong>Number of Floors:</strong> {project.bom.numFloors}
                  </p>
                  <p>
                    <strong>Room Count:</strong> {project.bom.roomCount}
                  </p>
                  <p>
                    <strong>Total Project Cost:</strong> ₱
                    {project.bom.totalProjectCost.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p>No projects found within the specified budget range.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default HouseSliders;
