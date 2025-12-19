package com.example.stresssense.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [SensorData::class, StressPrediction::class, TrustedContact::class, JournalEntry::class],
    version = 4,
    exportSchema = false // Set to false as we are not using auto-migrations in this setup
)
abstract class StressSenseDatabase : RoomDatabase() {

    abstract fun sensorDataDao(): SensorDataDao
    abstract fun stressPredictionDao(): StressPredictionDao
    abstract fun trustedContactDao(): TrustedContactDao
    abstract fun journalEntryDao(): JournalEntryDao

    companion object {
        const val DATABASE_NAME = "stress_sense_db"
    }
}
