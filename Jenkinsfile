pipeline {
  agent any

  parameters {
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Docker image tag to deploy')
  }

  environment {
    DOCKERHUB_USER = 'ghassenibiza1'
    APP_URL = 'http://10.97.0.111'
  }

  stages {
    stage('Render manifests') {
      steps {
        sh './k8s/render.sh'
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-td2', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -f rendered/'
        }
      }
    }

    stage('Wait for rollout') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-td2', variable: 'KUBECONFIG')]) {
          sh '''
            kubectl -n td2 rollout status deployment/backend --timeout=300s
            kubectl -n td2 rollout status deployment/frontend --timeout=180s
          '''
        }
      }
    }

    stage('Smoke test') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-td2', variable: 'KUBECONFIG')]) {
          sh '''
            curl -fsS "$APP_URL/" > /dev/null
            curl -fsS "$APP_URL/api/user/all"
            ACTUAL=$(kubectl -n td2 get deploy frontend -o jsonpath='{.spec.template.spec.containers[0].image}')
            echo "Deployed frontend image: $ACTUAL"
            test "$ACTUAL" = "$DOCKERHUB_USER/td2-frontend:$IMAGE_TAG"
          '''
        }
      }
    }
}

  post {
    success { echo "Deployed tag ${params.IMAGE_TAG} to Kubernetes" }
    failure { echo "Deployment of tag ${params.IMAGE_TAG} failed" }
  }
}
