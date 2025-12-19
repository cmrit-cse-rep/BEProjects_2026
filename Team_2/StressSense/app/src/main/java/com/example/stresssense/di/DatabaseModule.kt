package com.example.stresssense.di

import android.content.Context
import androidx.room.Room
import com.example.stresssense.data.local.JournalEntryDao
import com.example.stresssense.data.local.SensorDataDao
import com.example.stresssense.data.local.StressPredictionDao
import com.example.stresssense.data.local.StressSenseDatabase
import com.example.stresssense.data.local.TrustedContactDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideStressSenseDatabase(@ApplicationContext context: Context): StressSenseDatabase {
        return Room.databaseBuilder(
            context,
            StressSenseDatabase::class.java,
            StressSenseDatabase.DATABASE_NAME
        )
        // This will destroy and recreate the database if a migration is needed and schemas are not found.
        // This is safe for development but should be replaced with proper manual migrations in production.
        .fallbackToDestructiveMigration()
        .build()
    }

    @Provides
    @Singleton
    fun provideSensorDataDao(database: StressSenseDatabase): SensorDataDao {
        return database.sensorDataDao()
    }

    @Provides
    @Singleton
    fun provideStressPredictionDao(database: StressSenseDatabase): StressPredictionDao {
        return database.stressPredictionDao()
    }

    @Provides
    @Singleton
    fun provideTrustedContactDao(database: StressSenseDatabase): TrustedContactDao {
        return database.trustedContactDao()
    }

    @Provides
    @Singleton
    fun provideJournalEntryDao(database: StressSenseDatabase): JournalEntryDao {
        return database.journalEntryDao()
    }
}
