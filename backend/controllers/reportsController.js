import EntPatient from "../models/EntPatient.js";
import ObstetricsPatient from "../models/ObstetricsPatient.js";
import { toIST } from "../utils/dateUtils.js";

class ReportsController {
  // GET comprehensive analytics report
  async getAnalyticsReport(req, res) {
    try {
      const { from, to, category } = req.query;

      // Date range filter
      const dateFilter = {};
      if (from || to) {
        dateFilter.createdAt = {};
        if (from) dateFilter.createdAt.$gte = new Date(from);
        if (to) dateFilter.createdAt.$lte = new Date(to);
      }

      // Fetch data based on category
      let entPatients = [];
      let obstetricsPatients = [];

      if (!category || category === "ent") {
        entPatients = await EntPatient.find({
          deleted: { $ne: true },
          ...dateFilter,
        });
      }

      if (!category || category === "obstetrics") {
        obstetricsPatients = await ObstetricsPatient.find({
          deleted: { $ne: true },
          ...dateFilter,
        });
      }

      // Generate comprehensive analytics
      const analytics = this.generateComprehensiveAnalytics(
        entPatients,
        obstetricsPatients
      );

      res.json({
        success: true,
        data: {
          generatedAt: toIST(),
          dateRange: { from, to },
          category,
          summary: {
            totalPatients: entPatients.length + obstetricsPatients.length,
            entPatients: entPatients.length,
            obstetricsPatients: obstetricsPatients.length,
            totalLogs: this.getTotalLogs(entPatients, obstetricsPatients),
          },
          analytics,
        },
      });
    } catch (error) {
      console.error("Error generating analytics report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate analytics report",
        error: error.message,
      });
    }
  }

  // GET patient outcomes report
  async getPatientOutcomes(req, res) {
    try {
      const { category = "all" } = req.query;

      let outcomes = {};

      if (category === "all" || category === "ent") {
        const entPatients = await EntPatient.find({ deleted: { $ne: true } });
        outcomes.ent = this.generateEntOutcomes(entPatients);
      }

      if (category === "all" || category === "obstetrics") {
        const obstetricsPatients = await ObstetricsPatient.find({
          deleted: { $ne: true },
        });
        outcomes.obstetrics =
          this.generateObstetricsOutcomes(obstetricsPatients);
      }

      res.json({
        success: true,
        data: {
          generatedAt: toIST(),
          category,
          outcomes,
        },
      });
    } catch (error) {
      console.error("Error generating outcomes report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate outcomes report",
        error: error.message,
      });
    }
  }

  // GET performance metrics
  async getPerformanceMetrics(req, res) {
    try {
      const { period = "30" } = req.query; // days
      const periodDays = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const entPatients = await EntPatient.find({
        deleted: { $ne: true },
        createdAt: { $gte: startDate },
      });

      const obstetricsPatients = await ObstetricsPatient.find({
        deleted: { $ne: true },
        createdAt: { $gte: startDate },
      });

      const metrics = this.calculatePerformanceMetrics(
        entPatients,
        obstetricsPatients,
        periodDays
      );

      res.json({
        success: true,
        data: {
          generatedAt: toIST(),
          period: `${periodDays} days`,
          metrics,
        },
      });
    } catch (error) {
      console.error("Error generating performance metrics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate performance metrics",
        error: error.message,
      });
    }
  }

  // GET treatment effectiveness report
  async getTreatmentEffectiveness(req, res) {
    try {
      const entPatients = await EntPatient.find({ deleted: { $ne: true } });
      const effectiveness = this.analyzeTreatmentEffectiveness(entPatients);

      res.json({
        success: true,
        data: {
          generatedAt: toIST(),
          effectiveness,
        },
      });
    } catch (error) {
      console.error("Error analyzing treatment effectiveness:", error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze treatment effectiveness",
        error: error.message,
      });
    }
  }

  // Helper methods
  generateComprehensiveAnalytics(entPatients, obstetricsPatients) {
    return {
      patientDistribution: this.getPatientDistribution(
        entPatients,
        obstetricsPatients
      ),
      recoveryTrends: this.getRecoveryTrends(entPatients),
      painAnalysis: this.getPainAnalysis(entPatients),
      medicationCompliance: this.getMedicationCompliance(entPatients),
      pregnancyProgress: this.getPregnancyProgress(obstetricsPatients),
      systemUtilization: this.getSystemUtilization(
        entPatients,
        obstetricsPatients
      ),
    };
  }

  getPatientDistribution(entPatients, obstetricsPatients) {
    const total = entPatients.length + obstetricsPatients.length;
    return {
      ent: {
        count: entPatients.length,
        percentage:
          total > 0 ? Math.round((entPatients.length / total) * 100) : 0,
      },
      obstetrics: {
        count: obstetricsPatients.length,
        percentage:
          total > 0 ? Math.round((obstetricsPatients.length / total) * 100) : 0,
      },
    };
  }

  getRecoveryTrends(entPatients) {
    const milestones = { swallowing: 0, breathing: 0, feverFree: 0, total: 0 };

    entPatients.forEach((patient) => {
      if (patient.logs) {
        patient.logs.forEach((log) => {
          if (log.logType === "healing_progress" && log.milestones) {
            milestones.total++;
            if (log.milestones.swallowing) milestones.swallowing++;
            if (log.milestones.breathing) milestones.breathing++;
            if (log.milestones.feverFree) milestones.feverFree++;
          }
        });
      }
    });

    return {
      swallowingRecovery: Math.round(
        (milestones.swallowing / Math.max(milestones.total, 1)) * 100
      ),
      breathingImprovement: Math.round(
        (milestones.breathing / Math.max(milestones.total, 1)) * 100
      ),
      feverFreeRate: Math.round(
        (milestones.feverFree / Math.max(milestones.total, 1)) * 100
      ),
      overallRecoveryRate: Math.round(
        ((milestones.swallowing + milestones.breathing + milestones.feverFree) /
          Math.max(milestones.total * 3, 1)) *
          100
      ),
    };
  }

  getPainAnalysis(entPatients) {
    const painLevels = [];
    let totalPainLogs = 0;
    let totalPainSum = 0;

    entPatients.forEach((patient) => {
      if (patient.logs) {
        patient.logs.forEach((log) => {
          if (log.logType === "pain_level" && log.painLevel !== undefined) {
            totalPainLogs++;
            totalPainSum += parseInt(log.painLevel);
            painLevels.push({
              level: parseInt(log.painLevel),
              date: log.loggedAt,
              patientId: patient.patientId,
            });
          }
        });
      }
    });

    const averagePain =
      totalPainLogs > 0
        ? Math.round((totalPainSum / totalPainLogs) * 10) / 10
        : 0;
    const painDistribution = this.calculatePainDistribution(painLevels);

    return {
      averagePainLevel: averagePain,
      totalPainLogs,
      painDistribution,
      trend: this.calculatePainTrend(painLevels),
    };
  }

  calculatePainDistribution(painLevels) {
    const distribution = { low: 0, moderate: 0, high: 0, severe: 0 };

    painLevels.forEach(({ level }) => {
      if (level <= 3) distribution.low++;
      else if (level <= 5) distribution.moderate++;
      else if (level <= 7) distribution.high++;
      else distribution.severe++;
    });

    const total = painLevels.length;
    return {
      low: {
        count: distribution.low,
        percentage: Math.round((distribution.low / Math.max(total, 1)) * 100),
      },
      moderate: {
        count: distribution.moderate,
        percentage: Math.round(
          (distribution.moderate / Math.max(total, 1)) * 100
        ),
      },
      high: {
        count: distribution.high,
        percentage: Math.round((distribution.high / Math.max(total, 1)) * 100),
      },
      severe: {
        count: distribution.severe,
        percentage: Math.round(
          (distribution.severe / Math.max(total, 1)) * 100
        ),
      },
    };
  }

  calculatePainTrend(painLevels) {
    if (painLevels.length < 2) return "insufficient_data";

    const sortedLevels = painLevels.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const firstHalf = sortedLevels.slice(
      0,
      Math.floor(sortedLevels.length / 2)
    );
    const secondHalf = sortedLevels.slice(Math.floor(sortedLevels.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, p) => sum + p.level, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, p) => sum + p.level, 0) / secondHalf.length;

    if (secondAvg < firstAvg - 0.5) return "improving";
    if (secondAvg > firstAvg + 0.5) return "worsening";
    return "stable";
  }

  getMedicationCompliance(entPatients) {
    let totalMedLogs = 0;
    let compliantLogs = 0;

    entPatients.forEach((patient) => {
      if (patient.logs) {
        patient.logs.forEach((log) => {
          if (log.logType === "medication") {
            totalMedLogs++;
            if (
              log.medication &&
              log.medication.name &&
              log.medication.dosage
            ) {
              compliantLogs++;
            }
          }
        });
      }
    });

    return {
      totalMedicationLogs: totalMedLogs,
      compliantLogs,
      complianceRate:
        totalMedLogs > 0 ? Math.round((compliantLogs / totalMedLogs) * 100) : 0,
    };
  }

  getPregnancyProgress(obstetricsPatients) {
    const trimesterData = { 1: 0, 2: 0, 3: 0 };
    const postnatalCount = obstetricsPatients.filter(
      (p) => p.isPostnatal
    ).length;

    obstetricsPatients.forEach((patient) => {
      if (patient.logs) {
        patient.logs.forEach((log) => {
          if (log.logType === "trimester_symptoms" && log.trimester) {
            trimesterData[log.trimester]++;
          }
        });
      }
    });

    return {
      totalPregnancies: obstetricsPatients.length,
      postnatalPatients: postnatalCount,
      trimesterActivity: trimesterData,
      postnatalRate:
        obstetricsPatients.length > 0
          ? Math.round((postnatalCount / obstetricsPatients.length) * 100)
          : 0,
    };
  }

  getSystemUtilization(entPatients, obstetricsPatients) {
    const totalLogs = this.getTotalLogs(entPatients, obstetricsPatients);
    const totalPatients = entPatients.length + obstetricsPatients.length;

    return {
      totalPatients,
      totalLogs,
      averageLogsPerPatient:
        totalPatients > 0
          ? Math.round((totalLogs / totalPatients) * 10) / 10
          : 0,
      activePatients: this.getActivePatients(entPatients, obstetricsPatients),
    };
  }

  getTotalLogs(entPatients, obstetricsPatients) {
    return (
      entPatients.reduce((sum, p) => sum + (p.logs?.length || 0), 0) +
      obstetricsPatients.reduce((sum, p) => sum + (p.logs?.length || 0), 0)
    );
  }

  getActivePatients(entPatients, obstetricsPatients) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeEnt = entPatients.filter(
      (patient) =>
        patient.logs &&
        patient.logs.some((log) => new Date(log.loggedAt) > thirtyDaysAgo)
    ).length;

    const activeObs = obstetricsPatients.filter(
      (patient) =>
        patient.logs &&
        patient.logs.some((log) => new Date(log.loggedAt) > thirtyDaysAgo)
    ).length;

    return activeEnt + activeObs;
  }

  generateEntOutcomes(entPatients) {
    const outcomes = { excellent: 0, good: 0, fair: 0, poor: 0 };

    entPatients.forEach((patient) => {
      if (patient.logs) {
        const healingLogs = patient.logs.filter(
          (log) => log.logType === "healing_progress"
        );
        if (healingLogs.length > 0) {
          const latestLog = healingLogs[healingLogs.length - 1];
          if (latestLog.healingProgress) {
            switch (latestLog.healingProgress.woundCondition) {
              case "healing_well":
                outcomes.excellent++;
                break;
              case "minor_issues":
                outcomes.good++;
                break;
              case "concerning":
                outcomes.fair++;
                break;
              case "needs_attention":
                outcomes.poor++;
                break;
            }
          }
        }
      }
    });

    const total = Object.values(outcomes).reduce(
      (sum, count) => sum + count,
      0
    );
    return {
      distribution: outcomes,
      percentages: {
        excellent: Math.round((outcomes.excellent / Math.max(total, 1)) * 100),
        good: Math.round((outcomes.good / Math.max(total, 1)) * 100),
        fair: Math.round((outcomes.fair / Math.max(total, 1)) * 100),
        poor: Math.round((outcomes.poor / Math.max(total, 1)) * 100),
      },
      successRate: Math.round(
        ((outcomes.excellent + outcomes.good) / Math.max(total, 1)) * 100
      ),
    };
  }

  generateObstetricsOutcomes(obstetricsPatients) {
    const outcomes = {
      totalPregnancies: obstetricsPatients.length,
      completedDeliveries: obstetricsPatients.filter((p) => p.isPostnatal)
        .length,
      activePregnancies: obstetricsPatients.filter((p) => !p.isPostnatal)
        .length,
    };

    return {
      ...outcomes,
      deliveryRate:
        outcomes.totalPregnancies > 0
          ? Math.round(
              (outcomes.completedDeliveries / outcomes.totalPregnancies) * 100
            )
          : 0,
    };
  }

  calculatePerformanceMetrics(entPatients, obstetricsPatients, periodDays) {
    const totalPatients = entPatients.length + obstetricsPatients.length;
    const totalLogs = this.getTotalLogs(entPatients, obstetricsPatients);

    return {
      patientRegistrationRate:
        Math.round((totalPatients / periodDays) * 10) / 10,
      logCreationRate: Math.round((totalLogs / periodDays) * 10) / 10,
      averageLogsPerPatient:
        totalPatients > 0
          ? Math.round((totalLogs / totalPatients) * 10) / 10
          : 0,
      systemGrowth: {
        newPatients: totalPatients,
        newLogs: totalLogs,
        growthRate: this.calculateGrowthRate(
          entPatients,
          obstetricsPatients,
          periodDays
        ),
      },
    };
  }

  calculateGrowthRate(entPatients, obstetricsPatients, periodDays) {
    // Simple growth calculation based on recent activity
    const recentActivity = entPatients.length + obstetricsPatients.length;
    const dailyAverage = recentActivity / periodDays;
    return Math.round(dailyAverage * 30 * 10) / 10; // Monthly projection
  }

  analyzeTreatmentEffectiveness(entPatients) {
    const treatments = {};

    entPatients.forEach((patient) => {
      if (patient.surgeryType) {
        if (!treatments[patient.surgeryType]) {
          treatments[patient.surgeryType] = {
            count: 0,
            outcomes: { excellent: 0, good: 0, fair: 0, poor: 0 },
            averagePainReduction: 0,
            recoveryRate: 0,
          };
        }

        treatments[patient.surgeryType].count++;

        // Analyze outcomes for this treatment
        if (patient.logs) {
          const healingLogs = patient.logs.filter(
            (log) => log.logType === "healing_progress"
          );
          if (healingLogs.length > 0) {
            const latestLog = healingLogs[healingLogs.length - 1];
            if (latestLog.healingProgress) {
              switch (latestLog.healingProgress.woundCondition) {
                case "healing_well":
                  treatments[patient.surgeryType].outcomes.excellent++;
                  break;
                case "minor_issues":
                  treatments[patient.surgeryType].outcomes.good++;
                  break;
                case "concerning":
                  treatments[patient.surgeryType].outcomes.fair++;
                  break;
                case "needs_attention":
                  treatments[patient.surgeryType].outcomes.poor++;
                  break;
              }
            }
          }
        }
      }
    });

    // Calculate effectiveness percentages
    Object.keys(treatments).forEach((treatmentType) => {
      const treatment = treatments[treatmentType];
      const total = Object.values(treatment.outcomes).reduce(
        (sum, count) => sum + count,
        0
      );
      treatment.successRate =
        total > 0
          ? Math.round(
              ((treatment.outcomes.excellent + treatment.outcomes.good) /
                total) *
                100
            )
          : 0;
    });

    return treatments;
  }
}

export default ReportsController;
