package com.example.stresssense.ml

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import org.tensorflow.lite.DataType
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import java.io.Closeable
import java.nio.ByteBuffer
import java.nio.ByteOrder
import javax.inject.Inject
import javax.inject.Singleton

/**
 * A wrapper for the TFLite stress prediction model.
 *
 * This class is responsible for loading the model, performing inference, and returning the result.
 * It dynamically reads the input and output tensor specifications from the model itself,
 * making it more robust to model changes.
 */
@Singleton
class StressPredictor @Inject constructor(
    @ApplicationContext private val context: Context
) : Closeable {

    private var interpreter: Interpreter?
    private val inputTensorShape: IntArray
    private val outputTensorShape: IntArray
    private val inputTensorDataType: DataType
    private val outputTensorDataType: DataType

    init {
        try {
            val model = FileUtil.loadMappedFile(context, MODEL_PATH)
            interpreter = Interpreter(model, Interpreter.Options()).also {
                // Get input tensor details from the model
                val inputTensor = it.getInputTensor(0)
                inputTensorShape = inputTensor.shape()
                inputTensorDataType = inputTensor.dataType()

                // Get output tensor details from the model
                val outputTensor = it.getOutputTensor(0)
                outputTensorShape = outputTensor.shape()
                outputTensorDataType = outputTensor.dataType()
            }
        } catch (e: Exception) {
            throw StressPredictorInitializationException("Failed to initialize StressPredictor", e)
        }
    }

    /**
     * Performs inference on the given input data.
     *
     * @param inputData A 2D FloatArray matching the model's expected input shape.
     * For example: `arrayOf(floatArrayOf(heartRate, steps, motion, sleep))`
     * @return A [Result] containing the stress prediction as a Float on success, or an Exception on failure.
     */
    fun predict(inputData: Array<FloatArray>): Result<Float> {
        val currentInterpreter = interpreter ?: return Result.failure(IllegalStateException("Interpreter is not initialized or has been closed."))

        return try {
            // 1. Allocate buffer for input and fill it
            val inputBuffer = ByteBuffer.allocateDirect(inputTensorShape.fold(1, Int::times) * inputTensorDataType.byteSize())
                .apply {
                    order(ByteOrder.nativeOrder())
                    for (row in inputData) {
                        for (value in row) {
                            putFloat(value)
                        }
                    }
                    rewind()
                }

            // 2. Allocate buffer for output
            val outputBuffer = ByteBuffer.allocateDirect(outputTensorShape.fold(1, Int::times) * outputTensorDataType.byteSize())
                .apply {
                    order(ByteOrder.nativeOrder())
                }

            // 3. Run inference
            currentInterpreter.run(inputBuffer, outputBuffer)

            // 4. Process the output
            outputBuffer.rewind()
            val prediction = outputBuffer.asFloatBuffer().get()

            Result.success(prediction)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Releases resources used by the TFLite interpreter.
     * Since this is a Singleton, this should ideally be called when the application is terminating.
     */
    override fun close() {
        interpreter?.close()
        interpreter = null
    }

    /**
     * High-level prediction method that handles data formatting.
     * Takes the most recent sensor data, adapts it to the model's required input shape, and returns a score.
     */
    fun predict(sensorDataList: List<com.example.stresssense.data.local.SensorData>): Float? {
        if (interpreter == null) return null
        if (sensorDataList.isEmpty()) return null

        // 1. Determine Model Requirements
        // shape is usually [BatchSize, TimeSteps, Features]
        // Example: [1, 60, 5] -> 1 batch, 60 seconds history, 5 features (HR, Steps, X, Y, Z)
        val timeSteps = if (inputTensorShape.size >= 2) inputTensorShape[1] else 1
        val features = if (inputTensorShape.size >= 3) inputTensorShape[2] else 1

        // 2. Prepare Data Window (Take last N samples)
        val window = sensorDataList.takeLast(timeSteps)
        
        // 3. Flatten and Pack into 2D Array [1, TimeSteps * Features] or specific shape
        // Note: Java/Kotlin TFLite API often expects [Batch, TimeSteps, Features] as a multi-dimensional array
        // OR a flat float buffer. We used ByteBuffer in predict(), so let's stick to creating the correct float input.
        
        // Let's create a 2D array [1][TimeSteps * Features] if the model is flat, 
        // or [1][TimeSteps][Features] if it's 3D. 
        // To be safe and generic for the ByteBuffer method we wrote earlier:
        // We just need to flatten everything into a sequence that matches the byte buffer order.
        
        val inputFlat = FloatArray(timeSteps * features)
        
        for (i in 0 until timeSteps) {
            if (i < window.size) {
                val data = window[i]
                // Feature Mapping (Must match training!)
                // 0: Heart Rate (Norm / 200)
                // 1: Steps (Log or / 100)
                // 2: X
                // 3: Y
                // 4: Z
                
                // Safety check on features count to prevent OutOfBounds
                if (features >= 1) inputFlat[i * features + 0] = (data.heartRate / 200.0).toFloat()
                if (features >= 2) inputFlat[i * features + 1] = (data.steps / 100).toFloat()
                if (features >= 3) inputFlat[i * features + 2] = data.motionX
                if (features >= 4) inputFlat[i * features + 3] = data.motionY
                if (features >= 5) inputFlat[i * features + 4] = data.motionZ
            } else {
                // Padding with zeros if not enough data
            }
        }
        
        // Wrap as a single "row" for the predict method which expects Array<FloatArray>
        // But wait, our predict method expects Array<FloatArray>. 
        // If the model expects [1, 60, 5], we might need to pass [[[...]]] which is complex.
        
        // Simplified approach: Re-implement inference here using specific shape logic
        // or ensure predict() handles the buffer correctly.
        // The existing predict() method treats the input as flat floats written into a ByteBuffer.
        // So passing `arrayOf(inputFlat)` works if we consider the input as one big flat vector 
        // relative to the ByteBuffer.
        
        // Let's rely on the existing predict method's ByteBuffer logic which assumes it can flatten whatever we pass.
        // We pass a single float array containing all data.
        
        val result = predict(arrayOf(inputFlat))
        return result.getOrNull()
    }

    companion object {
        // Ensure your model file in app/src/main/assets has this name
        private const val MODEL_PATH = "stress_model.tflite"
    }
}

class StressPredictorInitializationException(message: String, cause: Throwable? = null) : Exception(message, cause)
