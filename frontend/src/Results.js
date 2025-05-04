import React from 'react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, Users, Award, Clock, CheckCircle } from 'lucide-react';

const Results = ({ election }) => {
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [electionStatus, setElectionStatus] = useState('active');
  const [remainingTime, setRemainingTime] = useState('');
  const [totalEligibleVoters, setTotalEligibleVoters] = useState(0);
  
  // Colors for the charts
  const COLORS = ['#6c5ce7', '#00cec9', '#00b894', '#fdcb6e', '#ff7675'];
  
  useEffect(() => {
    if (election) {
      // Format data for bar chart
      const formattedData = election.candidates.map(candidate => ({
        name: candidate.name,
        votes: candidate.votes,
        platform: candidate.platform
      }));
      setChartData(formattedData);

      // Format data for pie chart
      const totalVotes = election.votedCount;
      const pieFormattedData = election.candidates.map(candidate => ({
        name: candidate.name,
        value: candidate.votes,
        percent: totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0
      }));
      setPieData(pieFormattedData);

      // Set initial election status
      setElectionStatus(election.status);

      // Debug logging
      console.log('Election object:', election);
      console.log('EligibleVoters:', election.eligibleVoters);
      console.log('Current totalVoters:', election.totalVoters);

      // Dynamically compute totalVoters based on eligibleVoters
      let eligibleCount = 0;
      
      if (election.eligibleVoters) {
        // Check if it's an array
        if (Array.isArray(election.eligibleVoters)) {
          eligibleCount = election.eligibleVoters.length;
        } 
        // Check if it's an object
        else if (typeof election.eligibleVoters === 'object') {
          eligibleCount = Object.keys(election.eligibleVoters).length;
        }
      }
      
      // Fallback to totalVoters if eligibleVoters is empty
      if (eligibleCount === 0 && election.totalVoters) {
        eligibleCount = election.totalVoters;
      }
      
      console.log('Calculated eligible voters:', eligibleCount);
      setTotalEligibleVoters(eligibleCount);
    }
  }, [election]);
  
  // Add timer effect for active elections
  useEffect(() => {
    let interval;
    
    if (election && electionStatus === 'active') {
      const updateTimer = () => {
        const endTime = new Date(election.endTime);
        const now = new Date();
        const diff = endTime - now;
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setRemainingTime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setRemainingTime('Ended');
          setElectionStatus('completed');
          clearInterval(interval);
        }
      };
      
      // Update immediately
      updateTimer();
      
      // Update every second
      interval = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [election, electionStatus]);
  
  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-name">{label}</p>
          <p className="tooltip-votes">{`${payload[0].value} votes`}</p>
          <p className="tooltip-platform">{payload[0].payload.platform}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-name">{payload[0].name}</p>
          <p className="tooltip-votes">{`${payload[0].value} votes (${payload[0].payload.percent}%)`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Render a custom label for the pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="pie-label"
      >
        {`${pieData[index].name} (${pieData[index].percent}%)`}
      </text>
    ) : null;
  };
  
  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Election Results</h2>
        <div className="status-indicator">
          {electionStatus === 'active' && (
            <div className="status active">
              <Clock size={16} />
              <span>Active - {remainingTime} remaining</span>
            </div>
          )}
          {electionStatus === 'completed' && (
            <div className="status completed">
              <CheckCircle size={16} />
              <span>Completed</span>
            </div>
          )}
          {electionStatus === 'upcoming' && (
            <div className="status upcoming">
              <Clock size={16} />
              <span>Upcoming</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="participation-stats">
        <div className="stat-card">
          <div className="stat-icon voter">
            <Users size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{election?.votedCount || 0}</span>
            <span className="stat-label">Votes Cast</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon admin">
            <Shield size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalEligibleVoters}</span>
            <span className="stat-label">Eligible Voters</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon auditor">
            <Award size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {totalEligibleVoters > 0 
                ? `${Math.round((election?.votedCount / totalEligibleVoters) * 100)}%` 
                : '0%'}
            </span>
            <span className="stat-label">Participation</span>
          </div>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Vote Distribution</h3>
          <div className="chart bar-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="name"
                  tick={{ fill: '#636e72', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  tick={{ fill: '#636e72', fontSize: 12 }}
                  label={{ value: 'Votes', angle: -90, position: 'insideLeft', style: { fill: '#636e72' } }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="votes" fill="#6c5ce7" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-wrapper">
          <h3>Percentage Distribution</h3>
          <div className="chart pie-chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;