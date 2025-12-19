package com.example.stresssense.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TrustedContactDao {
    @Query("SELECT * FROM trusted_contacts")
    fun getAllContacts(): Flow<List<TrustedContact>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertContact(contact: TrustedContact)

    @Delete
    suspend fun deleteContact(contact: TrustedContact)
}