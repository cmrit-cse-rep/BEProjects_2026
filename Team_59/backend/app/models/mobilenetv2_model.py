# backend/app/models/mobilenetv2_model.py
import torch.nn as nn
import timm

class SmallMedNet(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = timm.create_model('mobilenetv2_100', pretrained=False, num_classes=0)
        self.classifier = nn.Linear(1280, num_classes)

    def forward(self, x):
        features = self.backbone(x)
        if isinstance(features, (tuple, list)):
            features = features[-1]
        logits = self.classifier(features)
        return logits
