pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = "gursimar17"
        // These match the 'image' tags we will push
        BACKEND_IMAGE  = "${DOCKER_HUB_USER}/ai-counsellor-backend:latest"
        FRONTEND_IMAGE = "${DOCKER_HUB_USER}/ai-counsellor-frontend:latest"
        // Use the ID of the credentials you created in Jenkins
        DOCKER_HUB_CREDS = credentials('docker-hub-creds')
        GEMINI_KEY = credentials('GEMINI_API_KEY')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Tag Images') {
            steps {
                script {
                    echo "Building Backend..."
                    sh "docker build -t ${BACKEND_IMAGE} ./backend"
                    
                    echo "Building Frontend..."
                    sh "docker build -t ${FRONTEND_IMAGE} ./frontend"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    sh "echo \$DOCKER_HUB_CREDS_PSW | docker login -u \$DOCKER_HUB_CREDS_USR --password-stdin"
                    sh "docker push ${BACKEND_IMAGE}"
                    sh "docker push ${FRONTEND_IMAGE}"
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    echo "Deploying Services..."
                    // -f points to your compose file
                    // --build is skipped because we use the images we just pushed
                    // We pull latest images first to ensure we aren't using old local cache
                    sh "docker-compose pull"
                    
                    // This makes the GEMINI_API_KEY available to docker-compose.yml
                    sh "GEMINI_API_KEY=${GEMINI_KEY} docker-compose up -d"
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "Waiting for services to stabilize..."
                    sleep 10
                    sh "docker-compose ps"
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up local build residue..."
            sh "docker image prune -f"
        }
        success {
            echo "Application is live at http://your-aws-ip:3000"
        }
    }
}
