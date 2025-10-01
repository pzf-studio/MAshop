document.addEventListener('DOMContentLoaded', function() {
    // Добавление строк в таблицу цен
    const addPriceRowBtn = document.getElementById('add-price-row');
    const priceTableBody = document.getElementById('price-table-body');
    
    addPriceRowBtn.addEventListener('click', function() {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" placeholder="Введите описание услуги"></td>
            <td><input type="text" placeholder="Введите цену"></td>
        `;
        priceTableBody.appendChild(newRow);
    });
    
    // Добавление новых топиков
    const addTopicBtn = document.getElementById('add-topic-btn');
    const topicsContainer = document.getElementById('topics-container');
    
    addTopicBtn.addEventListener('click', function() {
        const topicCount = topicsContainer.children.length + 1;
        const newTopic = document.createElement('div');
        newTopic.classList.add('topic');
        newTopic.innerHTML = `
            <div class="topic-header">
                <div class="topic-title-wrapper">
                    <h3 class="topic-title">Новый блок ${topicCount}</h3>
                    <input type="text" class="topic-title-input" value="Новый блок ${topicCount}">
                </div>
                <div class="topic-actions">
                    <button class="topic-btn edit" title="Редактировать название">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="topic-btn delete" title="Удалить блок">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="topic-content">
                <textarea placeholder="Введите текст для этого блока..."></textarea>
            </div>
        `;
        topicsContainer.appendChild(newTopic);
        
        // Добавляем обработчики для новых кнопок
        setupTopicActions(newTopic);
    });
    
    // Функция для настройки обработчиков действий топика
    function setupTopicActions(topicElement) {
        // Обработчик удаления
        const deleteBtn = topicElement.querySelector('.topic-btn.delete');
        deleteBtn.addEventListener('click', function() {
            if (confirm('Вы уверены, что хотите удалить этот блок?')) {
                topicsContainer.removeChild(topicElement);
            }
        });
        
        // Обработчик редактирования названия
        const editBtn = topicElement.querySelector('.topic-btn.edit');
        const titleElement = topicElement.querySelector('.topic-title');
        const titleInput = topicElement.querySelector('.topic-title-input');
        
        editBtn.addEventListener('click', function() {
            titleElement.style.display = 'none';
            titleInput.style.display = 'block';
            titleInput.focus();
            titleInput.select();
        });
        
        // Завершение редактирования по нажатию Enter
        titleInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                finishEditing();
            }
        });
        
        // Завершение редактирования при потере фокуса
        titleInput.addEventListener('blur', function() {
            finishEditing();
        });
        
        function finishEditing() {
            const newTitle = titleInput.value.trim();
            if (newTitle) {
                titleElement.textContent = newTitle;
            }
            titleElement.style.display = 'block';
            titleInput.style.display = 'none';
        }
        
        // Двойной клик по названию для редактирования
        titleElement.addEventListener('dblclick', function() {
            titleElement.style.display = 'none';
            titleInput.style.display = 'block';
            titleInput.focus();
            titleInput.select();
        });
    }
    
    // Настройка обработчиков для существующих топиков
    const existingTopics = document.querySelectorAll('.topic');
    existingTopics.forEach(topic => {
        setupTopicActions(topic);
    });
    
    // Предпросмотр
    const previewBtn = document.getElementById('preview-btn');
    const previewModal = document.getElementById('preview-modal');
    const closeModal = document.getElementById('close-modal');
    const previewContent = document.getElementById('preview-content');
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        if (event.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
    
    // Упрощенная функция для водяных знаков в PDF
    function createPDFWatermark(doc) {
        const totalPages = doc.internal.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // Сохраняем текущие настройки
            const originalTextColor = doc.getTextColor();
            
            // Только угловой водяной знак (легкий)
            doc.setTextColor(136, 211, 206, 0.03);
            doc.setFontSize(8);
            doc.text(`PZF-Studio - Страница ${i}`, pageWidth - 30, pageHeight - 10);
            
            // Восстанавливаем оригинальные настройки
            doc.setTextColor(originalTextColor);
        }
    }
    
    // Функция генерации предпросмотра
    function generateStyledPreview(forPDF = false) {
        let previewHTML = `
            <div class="preview-content document-style ${forPDF ? 'pdf-export' : ''}">
                ${forPDF ? '<div class="watermark pdf-watermark pdf-corner">PZF-Studio</div>' : ''}
                
                <div class="document-header">
                    <h1 class="document-title">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
                    <p class="document-subtitle">Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
                </div>
        `;
        
        // Таблица цен
        const priceRows = document.querySelectorAll('#price-table-body tr');
        let hasPriceData = false;
        
        priceRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs[0].value.trim() !== '' || inputs[1].value.trim() !== '') {
                hasPriceData = true;
            }
        });
        
        if (hasPriceData) {
            previewHTML += `
                <div class="document-section">
                    <h2 class="document-section-title">СТОИМОСТЬ УСЛУГ</h2>
                    <table class="document-table">
                        <thead>
                            <tr>
                                <th width="70%">Услуга / Описание</th>
                                <th width="30%">Цена</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            priceRows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                const service = inputs[0].value.trim() || 'Не указано';
                const price = inputs[1].value.trim() || 'Не указано';
                
                previewHTML += `
                    <tr>
                        <td>${service}</td>
                        <td>${price}</td>
                    </tr>
                `;
            });
            
            previewHTML += `</tbody></table></div>`;
        }
        
        // Топики
        const topics = document.querySelectorAll('.topic');
        let hasTopicData = false;
        
        topics.forEach(topic => {
            const content = topic.querySelector('textarea').value;
            if (content.trim() !== '') {
                hasTopicData = true;
            }
        });
        
        if (hasTopicData) {
            topics.forEach(topic => {
                const title = topic.querySelector('.topic-title').textContent;
                const content = topic.querySelector('textarea').value;
                
                if (content.trim() !== '') {
                    previewHTML += `
                        <div class="document-topic">
                            <h3 class="document-topic-title">${title}</h3>
                            <div class="document-topic-content">${content.replace(/\n/g, '<br>')}</div>
                        </div>
                    `;
                }
            });
        }
        
        // Футер документа
        previewHTML += `
            <div class="document-footer">
                <p>С уважением, команда PZF-Studio</p>
                <div class="document-contact">
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>info@pzf-studio.ru</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>+7 (XXX) XXX-XX-XX</span>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        return previewHTML;
    }
    
    // Функция стандартного предпросмотра
    function generateStandardPreview() {
        let previewHTML = `
            <div class="preview-header">
                <h1>Коммерческое предложение</h1>
                <p>Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>
        `;
        
        // Таблица цен
        const priceRows = document.querySelectorAll('#price-table-body tr');
        let hasPriceData = false;
        
        priceRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs[0].value.trim() !== '' || inputs[1].value.trim() !== '') {
                hasPriceData = true;
            }
        });
        
        if (hasPriceData) {
            previewHTML += `<h2>Стоимость услуг</h2>`;
            previewHTML += `<table class="preview-table">`;
            previewHTML += `<thead><tr><th>Услуга / Описание</th><th>Цена</th></tr></thead><tbody>`;
            
            priceRows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                const service = inputs[0].value.trim() || 'Не указано';
                const price = inputs[1].value.trim() || 'Не указано';
                
                previewHTML += `<tr><td>${service}</td><td>${price}</td></tr>`;
            });
            
            previewHTML += `</tbody></table>`;
        }
        
        // Топики
        const topics = document.querySelectorAll('.topic');
        let hasTopicData = false;
        
        topics.forEach(topic => {
            const content = topic.querySelector('textarea').value;
            if (content.trim() !== '') {
                hasTopicData = true;
            }
        });
        
        if (hasTopicData) {
            topics.forEach(topic => {
                const title = topic.querySelector('.topic-title').textContent;
                const content = topic.querySelector('textarea').value;
                
                if (content.trim() !== '') {
                    previewHTML += `
                        <div class="preview-topic">
                            <h3>${title}</h3>
                            <p>${content.replace(/\n/g, '<br>')}</p>
                        </div>
                    `;
                }
            });
        }
        
        return previewHTML;
    }
    
    // Основная функция предпросмотра
    function generatePreview(useStyled = true) {
        if (useStyled) {
            previewContent.innerHTML = generateStyledPreview();
            previewModal.classList.add('document-modal');
            closeModal.classList.add('document-close');
        } else {
            previewContent.innerHTML = generateStandardPreview();
            previewModal.classList.remove('document-modal');
            closeModal.classList.remove('document-close');
        }
        previewModal.style.display = 'flex';
    }
    
    // Улучшенная функция генерации PDF
    function generateStyledPDF() {
        if (!validateData()) {
            alert('Добавьте данные в таблицу цен или информационные блоки перед созданием PDF.');
            return;
        }

        // Показываем модальное окно с индикатором загрузки
        previewModal.style.display = 'flex';
        previewContent.innerHTML = '<div style="text-align: center; padding: 50px; color: white; font-size: 18px;">Генерация PDF... Пожалуйста, подождите.</div>';

        // Даем время отобразиться индикатору загрузки
        setTimeout(() => {
            // Создаем временный контейнер для рендеринга
            const tempContainer = document.createElement('div');
            tempContainer.className = 'pdf-temp-container';
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '0';
            tempContainer.style.top = '0';
            tempContainer.style.width = '794px';
            tempContainer.style.minHeight = '1123px';
            tempContainer.style.background = 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 100%)';
            tempContainer.style.padding = '40px';
            tempContainer.style.color = 'white';
            tempContainer.style.zIndex = '-10000';
            tempContainer.style.opacity = '0';
            
            // Генерируем содержимое для PDF
            tempContainer.innerHTML = generateStyledPreview(true);
            
            // Добавляем в DOM
            document.body.appendChild(tempContainer);

            // Ждем немного для рендеринга
            setTimeout(() => {
                html2canvas(tempContainer, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#0a0a1a',
                    width: 794,
                    height: tempContainer.scrollHeight,
                    windowWidth: 794,
                    scrollX: 0,
                    scrollY: 0,
                    onclone: function(clonedDoc) {
                        // Убедимся, что все стили применяются правильно
                        const previewContent = clonedDoc.querySelector('.preview-content');
                        if (previewContent) {
                            previewContent.style.width = '794px';
                            previewContent.style.background = 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 100%)';
                        }
                    }
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    
                    // Рассчитываем размеры изображения
                    const imgWidth = pageWidth - 20;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    let heightLeft = imgHeight;
                    let position = 10;
                    let pageNumber = 1;

                    // Добавляем первую страницу
                    doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    // Добавляем остальные страницы если нужно
                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight + 10;
                        doc.addPage();
                        pageNumber++;
                        doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    // Добавляем легкие водяные знаки
                    createPDFWatermark(doc);

                    // Убираем временный контейнер
                    document.body.removeChild(tempContainer);
                    
                    // Закрываем модальное окно
                    previewModal.style.display = 'none';

                    // Сохраняем PDF
                    doc.save('коммерческое-предложение-pzf-studio.pdf');

                }).catch(error => {
                    console.error('Ошибка при создании PDF:', error);
                    document.body.removeChild(tempContainer);
                    previewModal.style.display = 'none';
                    alert('Ошибка при создании PDF. Попробуйте еще раз.');
                });
            }, 500);
        }, 500);
    }
    
    // Простая функция генерации PDF
    function generateSimplePDF() {
        if (!validateData()) {
            alert('Добавьте данные в таблицу цен или информационные блоки перед созданием PDF.');
            return;
        }

        // Генерируем стандартный предпросмотр
        const content = generateStandardPreview();
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Добавляем заголовок
        doc.setFontSize(20);
        doc.text('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, 40);
        
        let yPosition = 60;
        
        // Добавляем таблицу цен
        const priceRows = document.querySelectorAll('#price-table-body tr');
        let hasPriceData = false;
        
        priceRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs[0].value.trim() !== '' || inputs[1].value.trim() !== '') {
                hasPriceData = true;
            }
        });
        
        if (hasPriceData) {
            doc.setFontSize(16);
            doc.text('СТОИМОСТЬ УСЛУГ', 20, yPosition);
            yPosition += 15;
            
            doc.setFontSize(12);
            priceRows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                const service = inputs[0].value.trim();
                const price = inputs[1].value.trim();
                
                if (service || price) {
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.text(`${service || 'Не указано'}`, 20, yPosition);
                    doc.text(`${price || 'Не указано'}`, 160, yPosition);
                    yPosition += 10;
                }
            });
            
            yPosition += 10;
        }
        
        // Добавляем топики
        const topics = document.querySelectorAll('.topic');
        
        topics.forEach(topic => {
            const title = topic.querySelector('.topic-title').textContent;
            const content = topic.querySelector('textarea').value;
            
            if (content.trim() !== '') {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.setFontSize(14);
                doc.text(title, 20, yPosition);
                yPosition += 10;
                
                doc.setFontSize(12);
                const lines = doc.splitTextToSize(content, 170);
                doc.text(lines, 20, yPosition);
                yPosition += (lines.length * 7) + 10;
            }
        });
        
        // Добавляем водяные знаки
        createPDFWatermark(doc);
        
        // Сохраняем PDF
        doc.save('коммерческое-предложение-pzf-studio.pdf');
    }

    // Проверка данных перед генерацией
    function validateData() {
        const priceRows = document.querySelectorAll('#price-table-body tr');
        let hasData = false;
        
        // Проверяем таблицу цен
        priceRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs[0].value.trim() !== '' || inputs[1].value.trim() !== '') {
                hasData = true;
            }
        });
        
        // Проверяем топики
        const topics = document.querySelectorAll('.topic textarea');
        topics.forEach(textarea => {
            if (textarea.value.trim() !== '') {
                hasData = true;
            }
        });
        
        return hasData;
    }
    
    // Добавляем кнопки переключения стилей в DOM
    function addStyleToggle() {
        const actions = document.querySelector('.actions');
        const styleToggle = document.createElement('div');
        styleToggle.className = 'style-toggle';
        styleToggle.innerHTML = `
            <button class="style-btn active" id="styled-preview">Стилизованный вид</button>
            <button class="style-btn" id="standard-preview">Стандартный вид</button>
        `;
        actions.parentNode.insertBefore(styleToggle, actions);
        
        // Обработчики для кнопок стилей
        document.getElementById('styled-preview').addEventListener('click', function() {
            document.getElementById('styled-preview').classList.add('active');
            document.getElementById('standard-preview').classList.remove('active');
            generatePreview(true);
        });
        
        document.getElementById('standard-preview').addEventListener('click', function() {
            document.getElementById('standard-preview').classList.add('active');
            document.getElementById('styled-preview').classList.remove('active');
            generatePreview(false);
        });
    }
    
    // Инициализация
    function init() {
        // Добавляем переключатели стилей
        addStyleToggle();
        
        // Обработчик кнопки предпросмотра
        previewBtn.addEventListener('click', function() {
            const useStyled = document.getElementById('styled-preview').classList.contains('active');
            generatePreview(useStyled);
        });
        
        // Обработчик кнопки скачивания PDF
        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.addEventListener('click', function() {
            try {
                generateStyledPDF();
            } catch (error) {
                console.error('Ошибка при генерации PDF:', error);
                alert('Произошла ошибка при создании PDF. Пожалуйста, проверьте введенные данные.');
            }
        });
        
        // Обработчик закрытия модального окна
        closeModal.addEventListener('click', function() {
            previewModal.style.display = 'none';
            previewModal.classList.remove('document-modal');
            closeModal.classList.remove('document-close');
        });
    }
    
    // Запускаем инициализацию
    init();
});