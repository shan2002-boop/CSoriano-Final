import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import styles from "../css/ProjectDetails.module.css";
import { useAuthContext } from '../hooks/useAuthContext';
import Navbar from './Navbar';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`https://foxconstruction-final.onrender.com/api/preprojects/${id}`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        setProject(response.data);
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return <p>Loading project details...</p>;
  }

  if (!project) {
    return <p>Project not found.</p>;
  }

  return (
    <>
      <Navbar />
      <div className={styles.detailsContainer}>
        <h1 className={styles.h123}>{project.title}</h1>
        <img
          src={
            project.image && project.image.length > 0
              ? project.image[0].path
              : "/placeholder.jpg"
          }
          alt={project.title}
          className={styles.projectImage}
        />
        <div className={styles.bomDetails}>
          <h2>Bill of Materials</h2>
          <p><strong>Total Area:</strong> {project.bom.totalArea || 0} sqm</p>
          <p><strong>Number of Floors:</strong> {project.bom.numFloors || 0}</p>
          <p><strong>Room Count:</strong> {project.bom.roomCount || 0}</p>
          <p><strong>Foundation Depth:</strong> {project.bom.foundationDepth || 0} m</p>
          <p><strong>Labor Cost:</strong> ₱{(project.bom.laborCost || 0).toLocaleString()}</p>
          <p><strong>Material Cost:</strong> ₱{(project.bom.materialTotalCost || 0).toLocaleString()}</p>
          <p><strong>Tax:</strong> ₱{(project.bom.tax || 0).toLocaleString()}</p>
          <p><strong>Total Project Cost:</strong> ₱{(project.bom.totalProjectCost || 0).toLocaleString()}</p>
          
          <h3>Materials</h3>
          <table className={styles.bomTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Cost (₱)</th>
                <th>Total Amount (₱)</th>
              </tr>
            </thead>
            <tbody>
              {project.bom.categories.map((category, categoryIndex) => (
                <React.Fragment key={categoryIndex}>
                  {category.materials.map((material, materialIndex) => (
                    <tr key={materialIndex}>
                      {materialIndex === 0 && (
                        <td rowSpan={category.materials.length}>
                          {category.category}
                        </td>
                      )}
                      <td>{material.description || "N/A"}</td>
                      <td>{material.quantity || 0}</td>
                      <td>{material.unit || "N/A"}</td>
                      <td>₱{(material.cost || 0).toLocaleString()}</td>
                      <td>₱{(material.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr>
                    
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
