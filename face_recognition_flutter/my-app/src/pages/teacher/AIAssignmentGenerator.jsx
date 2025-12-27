import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    LinearProgress,
    Alert,
    Card,
    CardContent,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    Stepper,
    Step,
    StepLabel,
    CircularProgress
} from '@mui/material';
import {
    CloudUpload,
    Psychology,
    Preview,
    Save,
    Delete,
    Edit,
    Info,
    CheckCircle,
    Error as ErrorIcon,
    Refresh
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';

// API service
import apiService from '../../services/api-service';

// Styled components
const StyledUploadBox = styled(Box)(({ theme, isDragging }) => ({
    border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.grey[400]}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    textAlign: 'center',
    backgroundColor: isDragging ? theme.palette.primary.light + '10' : theme.palette.grey[50],
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light + '20'
    }
}));

const AIAssignmentGenerator = () => {
    // State management
    const [activeStep, setActiveStep] = useState(0);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [capabilities, setCapabilities] = useState(null);
    const [previewQuestions, setPreviewQuestions] = useState(null);
    const [generationResult, setGenerationResult] = useState(null);
    
    // Form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignment_type: 'homework',
        question_count: 10,
        question_types: ['multiple_choice', 'short_answer'],
        difficulty: 'medium',
        language: 'vietnamese',
        subject_id: '',
        topic: '',
        is_public: false
    });

    const steps = [
        'Upload Document',
        'Configure Generation',
        'Preview Questions', 
        'Create Template'
    ];

    // Load capabilities on component mount
    useEffect(() => {
        loadCapabilities();
    }, []);

    const loadCapabilities = async () => {
        try {
            const response = await apiService.get('/api/ai/capabilities');
            setCapabilities(response.data);
        } catch (error) {
            console.error('Failed to load AI capabilities:', error);
            toast.error('Failed to load AI capabilities');
        }
    };

    // File handling
    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setActiveStep(1);
        }
    };

    const handleFileDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setActiveStep(1);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    // Form handling
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleQuestionTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            question_types: prev.question_types.includes(type)
                ? prev.question_types.filter(t => t !== type)
                : [...prev.question_types, type]
        }));
    };

    // Preview questions
    const handlePreview = async () => {
        if (!file) {
            toast.error('Please upload a document first');
            return;
        }

        setLoading(true);
        try {
            const previewData = new FormData();
            previewData.append('document', file);
            previewData.append('question_count', '5'); // Limited preview
            previewData.append('question_types', formData.question_types.join(','));
            previewData.append('difficulty', formData.difficulty);
            previewData.append('language', formData.language);

            const response = await apiService.post('/api/ai/preview-questions', previewData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setPreviewQuestions(response.data);
            setActiveStep(2);
            toast.success('Questions preview generated successfully!');
        } catch (error) {
            console.error('Preview generation failed:', error);
            toast.error(error.response?.data?.message || 'Failed to generate preview');
        } finally {
            setLoading(false);
        }
    };

    // Generate full assignment
    const handleGenerate = async () => {
        if (!file) {
            toast.error('Please upload a document first');
            return;
        }

        setLoading(true);
        try {
            const generationData = new FormData();
            generationData.append('document', file);
            
            // Add all form data
            Object.keys(formData).forEach(key => {
                if (key === 'question_types') {
                    generationData.append(key, formData[key].join(','));
                } else {
                    generationData.append(key, formData[key]);
                }
            });

            const response = await apiService.post('/api/ai/generate-assignment', generationData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setGenerationResult(response.data);
            setActiveStep(3);
            toast.success('Assignment template generated successfully!');
        } catch (error) {
            console.error('Assignment generation failed:', error);
            toast.error(error.response?.data?.message || 'Failed to generate assignment');
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setFile(null);
        setPreviewQuestions(null);
        setGenerationResult(null);
        setActiveStep(0);
        setFormData({
            title: '',
            description: '',
            assignment_type: 'homework',
            question_count: 10,
            question_types: ['multiple_choice', 'short_answer'],
            difficulty: 'medium',
            language: 'vietnamese',
            subject_id: '',
            topic: '',
            is_public: false
        });
    };

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology color="primary" />
                    AI Assignment Generator
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Upload a document and let AI generate assignment questions automatically
                </Typography>
            </Box>

            {/* Progress Stepper */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label, index) => (
                        <Step key={label}>
                            <StepLabel
                                StepIconComponent={({ active, completed }) => (
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: completed ? 'success.main' : 
                                                           active ? 'primary.main' : 'grey.300',
                                            color: 'white'
                                        }}
                                    >
                                        {completed ? <CheckCircle /> : index + 1}
                                    </Box>
                                )}
                            >
                                {label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Step Content */}
            {activeStep === 0 && (
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Step 1: Upload Document
                    </Typography>
                    
                    {/* File Upload */}
                    <StyledUploadBox
                        isDragging={isDragging}
                        onDrop={handleFileDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            {file ? file.name : 'Upload Document'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Drag and drop your document here, or click to browse
                        </Typography>
                        {capabilities && (
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Supported formats: {capabilities.supported_formats.join(', ')} | 
                                Max size: {capabilities.limits.max_file_size}
                            </Typography>
                        )}
                        <input
                            id="file-input"
                            type="file"
                            hidden
                            accept=".pdf,.docx,.txt,.xlsx"
                            onChange={handleFileSelect}
                        />
                    </StyledUploadBox>

                    {file && (
                        <Box sx={{ mt: 3 }}>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                File uploaded: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </Alert>
                            <Button
                                variant="contained"
                                onClick={() => setActiveStep(1)}
                                sx={{ mr: 2 }}
                            >
                                Next: Configure Generation
                            </Button>
                            <Button variant="outlined" onClick={() => setFile(null)}>
                                Remove File
                            </Button>
                        </Box>
                    )}
                </Paper>
            )}

            {activeStep === 1 && (
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Step 2: Configure Generation
                    </Typography>
                    
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Assignment Title"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Leave empty for auto-generation"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Leave empty for auto-generation"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Topic/Subject"
                                value={formData.topic}
                                onChange={(e) => handleInputChange('topic', e.target.value)}
                                sx={{ mb: 2 }}
                            />
                        </Grid>

                        {/* Generation Settings */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Assignment Type</InputLabel>
                                <Select
                                    value={formData.assignment_type}
                                    onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                                >
                                    <MenuItem value="homework">Homework</MenuItem>
                                    <MenuItem value="quiz">Quiz</MenuItem>
                                    <MenuItem value="exam">Exam</MenuItem>
                                    <MenuItem value="practice">Practice</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                type="number"
                                label="Number of Questions"
                                value={formData.question_count}
                                onChange={(e) => handleInputChange('question_count', parseInt(e.target.value))}
                                inputProps={{ min: 1, max: 20 }}
                                sx={{ mb: 2 }}
                            />

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Difficulty</InputLabel>
                                <Select
                                    value={formData.difficulty}
                                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                                >
                                    <MenuItem value="easy">Easy</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="hard">Hard</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Language</InputLabel>
                                <Select
                                    value={formData.language}
                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                >
                                    <MenuItem value="vietnamese">Vietnamese</MenuItem>
                                    <MenuItem value="english">English</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Question Types */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Question Types
                            </Typography>
                            {capabilities?.question_types.map(type => (
                                <FormControlLabel
                                    key={type.type}
                                    control={
                                        <Checkbox
                                            checked={formData.question_types.includes(type.type)}
                                            onChange={() => handleQuestionTypeChange(type.type)}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {type.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {type.description}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            ))}
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button variant="outlined" onClick={() => setActiveStep(0)}>
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handlePreview}
                            disabled={loading || formData.question_types.length === 0}
                            startIcon={loading ? <CircularProgress size={20} /> : <Preview />}
                        >
                            Preview Questions
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleGenerate}
                            disabled={loading || formData.question_types.length === 0}
                            startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
                        >
                            Generate Full Assignment
                        </Button>
                    </Box>
                </Paper>
            )}

            {activeStep === 2 && previewQuestions && (
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Step 3: Questions Preview
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            Preview of {previewQuestions.questions.length} sample questions.
                            The full generation will create {formData.question_count} questions.
                        </Typography>
                    </Alert>

                    {/* Document Info */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Document Analysis
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Format</Typography>
                                    <Typography variant="body1">{previewQuestions.document_info.format.toUpperCase()}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Word Count</Typography>
                                    <Typography variant="body1">{previewQuestions.document_info.word_count}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Pages</Typography>
                                    <Typography variant="body1">{previewQuestions.document_info.pages}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Reading Time</Typography>
                                    <Typography variant="body1">{previewQuestions.document_info.estimated_reading_time} min</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Preview Questions */}
                    <Typography variant="h6" gutterBottom>
                        Sample Questions
                    </Typography>
                    {previewQuestions.questions.map((question, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Chip 
                                        label={question.type.replace('_', ' ')} 
                                        color="primary" 
                                        size="small"
                                    />
                                    <Chip 
                                        label={question.difficulty} 
                                        color={question.difficulty === 'hard' ? 'error' : 
                                               question.difficulty === 'medium' ? 'warning' : 'success'} 
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body1" fontWeight="bold" gutterBottom>
                                    {question.question}
                                </Typography>
                                
                                {question.type === 'multiple_choice' && question.options && (
                                    <Box sx={{ ml: 2 }}>
                                        {question.options.map((option, optIndex) => (
                                            <Typography key={optIndex} variant="body2">
                                                {String.fromCharCode(65 + optIndex)}. {option}
                                            </Typography>
                                        ))}
                                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                            Correct answer: {question.correct_answer}
                                        </Typography>
                                    </Box>
                                )}

                                {question.explanation && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        <strong>Explanation:</strong> {question.explanation}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button variant="outlined" onClick={() => setActiveStep(1)}>
                            Back to Configuration
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleGenerate}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        >
                            Generate Full Assignment ({formData.question_count} questions)
                        </Button>
                    </Box>
                </Paper>
            )}

            {activeStep === 3 && generationResult && (
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Step 4: Generation Complete!
                    </Typography>
                    
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <Typography variant="body1">
                            Assignment template created successfully!
                        </Typography>
                    </Alert>

                    {/* Generation Results */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Generation Report
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Template ID</Typography>
                                    <Typography variant="body1">{generationResult.template.id}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Generation Time</Typography>
                                    <Typography variant="body1">{(generationResult.report.total_time_ms / 1000).toFixed(2)}s</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                                    <Typography variant="body1">{generationResult.report.success_rate}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Questions Generated</Typography>
                                    <Typography variant="body1">{formData.question_count}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            href={`/teacher/assignment-templates`}
                            sx={{ mr: 2 }}
                        >
                            View Template Bank
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                            startIcon={<Refresh />}
                        >
                            Generate Another
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Loading Overlay */}
            {loading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}
                >
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={60} sx={{ mb: 2 }} />
                        <Typography variant="h6">
                            {activeStep === 2 ? 'Generating preview...' : 'Generating assignment...'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            This may take a few moments
                        </Typography>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default AIAssignmentGenerator;